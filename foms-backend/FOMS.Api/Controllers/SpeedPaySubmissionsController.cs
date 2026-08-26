using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FOMS.Application.Interfaces;
using FOMS.Application.Services;
using FOMS.Domain.Entities;

namespace FOMS.Api.Controllers;

/// <summary>
/// Manual SpeedPay submission endpoints.
/// Allows the SpeedPay client portal to submit manual proof-of-payment
/// and the Finance Manager to view and validate those submissions.
/// </summary>
[ApiController]
[Route("api/speedpay/submissions")]
public class SpeedPaySubmissionsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public SpeedPaySubmissionsController(IApplicationDbContext context)
    {
        _context = context;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST api/speedpay/submissions
    // Called by SpeedPay Portal when a client uploads proof of payment
    // ──────────────────────────────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitRequest request)
    {
        if (request == null) return BadRequest(new { message = "Request body is required." });
        if (string.IsNullOrWhiteSpace(request.InvoiceId)) return BadRequest(new { message = "InvoiceId is required." });
        if (request.AmountPaid <= 0) return BadRequest(new { message = "AmountPaid must be greater than 0." });

        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == request.InvoiceId || i.InvoiceNo == request.InvoiceId);
        if (invoice == null)
            return NotFound(new { message = $"Invoice '{request.InvoiceId}' not found." });

        var submission = new SpeedPayManualSubmission
        {
            Id = Guid.NewGuid().ToString(),
            InvoiceId = invoice.Id,
            InvoiceNumber = invoice.InvoiceNo,
            ClientId = request.ClientId ?? invoice.ClientId,
            ClientName = request.ClientName ?? invoice.ClientName,
            PaymentMethod = request.PaymentMethod ?? "GCash",
            ReferenceNumber = request.ReferenceNumber ?? Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper(),
            AmountPaid = request.AmountPaid,
            ProofFileName = request.ProofFileName ?? "proof.jpg",
            ProofFileUrl = request.ProofFileUrl,
            Status = "Pending Validation",
            SubmittedAt = DateTime.UtcNow,
        };

        await _context.SpeedPayManualSubmissions.AddAsync(submission);

        // Also create a record in the Payments table for manual review
        var payment = new Payment
        {
            Id = submission.Id, // Link IDs directly for simple tracking
            InvoiceId = invoice.Id,
            InvoiceNo = invoice.InvoiceNo,
            ClientId = invoice.ClientId,
            ClientName = invoice.ClientName,
            Amount = request.AmountPaid,
            PaymentMethod = submission.PaymentMethod,
            ReferenceNumber = submission.ReferenceNumber,
            ProofImageUrl = submission.ProofFileUrl,
            Remarks = "Manual payment submission proof uploaded.",
            PaymentStatus = "Submitted", // Awaiting initial Accountant check
            SubmittedAt = DateTime.UtcNow,
            PaymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            DateRecorded = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            RecordedBy = submission.ClientName
        };
        await _context.Payments.AddAsync(payment);

        invoice.PaymentStatus = "Pending Payment Validation";
        invoice.PaymentValidationStatus = "Submitted for Review";
        _context.Invoices.Update(invoice);

        // Payment History
        var history = new PaymentHistory
        {
            Id = Guid.NewGuid().ToString(),
            PaymentId = payment.Id,
            InvoiceId = invoice.Id,
            Status = "Pending Validation",
            Action = "Payment Submitted",
            Remarks = "Manual payment proof uploaded. Pending validation.",
            PerformedBy = submission.ClientName,
            PerformedRole = "Client",
            CreatedAt = DateTime.UtcNow
        };
        _context.PaymentHistories.Add(history);

        // Notifications
        var notif = new Notification
        {
            Id = Guid.NewGuid().ToString(),
            Type = "PAYMENT_VALIDATION_REQUIRED",
            Title = "Payment Needs Validation",
            Description = $"A SpeedPay payment for Invoice {invoice.InvoiceNo} is pending validation.",
            InvoiceNo = invoice.InvoiceNo,
            RecipientRole = "Accountant",
            RelatedPaymentId = payment.Id,
            RelatedInvoiceId = invoice.Id,
            Read = false,
            Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
            Source = "SpeedPay Gateway"
        };
        _context.Notifications.Add(notif);

        await _context.SaveChangesAsync(default);

        return CreatedAtAction(nameof(GetById), new { id = submission.Id }, new
        {
            submission.Id,
            submission.Status,
            submission.SubmittedAt,
            message = "Payment submission received. Pending Finance validation."
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET api/speedpay/submissions
    // Returns all manual submissions for the Finance Manager dashboard
    // ──────────────────────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var query = _context.SpeedPayManualSubmissions.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status == status);

        var results = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new
            {
                s.Id,
                s.InvoiceId,
                s.InvoiceNumber,
                s.ClientId,
                s.ClientName,
                s.PaymentMethod,
                s.ReferenceNumber,
                s.AmountPaid,
                s.ProofFileName,
                s.ProofFileUrl,
                s.Status,
                s.SubmittedAt,
            })
            .ToListAsync();

        return Ok(results);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET api/speedpay/submissions/{id}
    // ──────────────────────────────────────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var submission = await _context.SpeedPayManualSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null) return NotFound(new { message = $"Submission '{id}' not found." });
        return Ok(submission);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT api/speedpay/submissions/{id}/status
    // Finance Manager validates or rejects a submission
    // Body: { "status": "Validated" | "Rejected", "remarks": "..." }
    // ──────────────────────────────────────────────────────────────────────────
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
    {
        var submission = await _context.SpeedPayManualSubmissions.FirstOrDefaultAsync(s => s.Id == id);
        if (submission == null) return NotFound(new { message = $"Submission '{id}' not found." });

        var allowed = new[] { "Validated", "Rejected", "Pending Validation" };
        if (!allowed.Contains(request.Status))
            return BadRequest(new { message = $"Invalid status '{request.Status}'. Allowed: {string.Join(", ", allowed)}" });

        submission.Status = request.Status;

        // Sync with payments table
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == submission.Id);
        if (payment == null)
        {
            payment = new Payment
            {
                Id = submission.Id,
                InvoiceId = submission.InvoiceId,
                InvoiceNo = submission.InvoiceNumber,
                ClientId = submission.ClientId,
                ClientName = submission.ClientName,
                Amount = submission.AmountPaid,
                PaymentMethod = submission.PaymentMethod,
                ReferenceNumber = submission.ReferenceNumber,
                ProofImageUrl = submission.ProofFileUrl,
                Remarks = request.Remarks ?? "Manual submission status updated.",
                PaymentStatus = request.Status == "Validated" ? "Validated" : request.Status == "Rejected" ? "Rejected" : "Submitted",
                SubmittedAt = submission.SubmittedAt,
                PaymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                DateRecorded = DateTime.UtcNow.ToString("yyyy-MM-dd")
            };
            await _context.Payments.AddAsync(payment);
        }
        else
        {
            payment.PaymentStatus = request.Status == "Validated" ? "Validated" : request.Status == "Rejected" ? "Rejected" : "Submitted";
        }

        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == submission.InvoiceId);

        if (request.Status == "Validated")
        {
            if (invoice != null)
            {
                decimal beforeBalance = invoice.Balance;
                string beforeStatus = invoice.PaymentStatus;

                invoice.AmountPaid += submission.AmountPaid;
                BillingComputationService.RecalculateInvoice(invoice);
                invoice.UpdatedBy = "Finance Manager";
                invoice.PaymentValidationStatus = "Validated";

                // Generate OR
                var orNum = await GenerateNextOrNumberAsync();
                payment.OrNumber = orNum;

                // Create official receipt and collection records
                var paymentCollection = new PaymentCollection
                {
                    InvoiceId = invoice.Id,
                    CollectedDate = DateTime.UtcNow,
                    AmountCollected = submission.AmountPaid,
                    PaymentMethod = submission.PaymentMethod,
                    Status = "Completed"
                };
                _context.PaymentCollections.Add(paymentCollection);

                var officialReceipt = new OfficialReceipt
                {
                    PaymentCollectionId = paymentCollection.Id,
                    ReceiptNumber = orNum,
                    IssuedDate = DateTime.UtcNow
                };
                _context.OfficialReceipts.Add(officialReceipt);

                // Sync AR (ReceivableBalance)
                var receivable = await _context.ReceivableBalances.FirstOrDefaultAsync(r => r.InvoiceId == invoice.Id);
                if (receivable != null)
                {
                    receivable.BalanceAmount = invoice.Balance;
                    receivable.PaidAmount += submission.AmountPaid;
                    receivable.LastPaymentDate = DateTime.UtcNow;
                    receivable.Status = invoice.Balance <= 0 ? "Fully Paid" : "Partially Paid";
                    _context.ReceivableBalances.Update(receivable);
                }
                else if (invoice.Balance > 0)
                {
                    receivable = new ReceivableBalance
                    {
                        ClientId = invoice.ClientId,
                        InvoiceId = invoice.Id,
                        BalanceAmount = invoice.Balance,
                        PaidAmount = submission.AmountPaid,
                        LastPaymentDate = DateTime.UtcNow,
                        Status = "Partially Paid",
                        DueDate = DateTime.TryParse(invoice.DueDate, out var parsedDue) ? parsedDue : DateTime.UtcNow.AddDays(30)
                    };
                    _context.ReceivableBalances.Add(receivable);
                }

                // Sync Client Account balance
                await BillingComputationService.SyncClientBalanceAsync(invoice.ClientId, _context, default);

                // Payment History
                var history = new PaymentHistory
                {
                    Id = Guid.NewGuid().ToString(),
                    PaymentId = payment.Id,
                    InvoiceId = invoice.Id,
                    Status = "Validated",
                    Action = "Validate Payment",
                    Remarks = request.Remarks ?? "Manual submission validated by Finance Manager.",
                    PerformedBy = "Finance Manager",
                    PerformedRole = "Financial Manager",
                    CreatedAt = DateTime.UtcNow
                };
                _context.PaymentHistories.Add(history);

                // Audit Log
                var audit = new AuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = "Finance Manager",
                    EntityName = "Payment",
                    EntityId = payment.Id,
                    Action = "Validate Payment",
                    Details = $"Validated manual payment of {submission.AmountPaid:N2} for Invoice {invoice.InvoiceNo}.",
                    LoggedAt = DateTime.UtcNow,
                    BeforeValue = $"Balance: {beforeBalance:N2} | Status: {beforeStatus}",
                    AfterValue = $"Balance: {invoice.Balance:N2} | Status: {invoice.PaymentStatus}"
                };
                await _context.AuditLogs.AddAsync(audit);
            }
        }
        else if (request.Status == "Rejected")
        {
            if (invoice != null)
            {
                invoice.PaymentStatus = invoice.AmountPaid > 0 ? "Partially Paid" : "Unpaid";
                invoice.PaymentValidationStatus = "Rejected";
                _context.Invoices.Update(invoice);

                var history = new PaymentHistory
                {
                    Id = Guid.NewGuid().ToString(),
                    PaymentId = payment.Id,
                    InvoiceId = invoice.Id,
                    Status = "Rejected",
                    Action = "Reject Payment",
                    Remarks = request.Remarks ?? "Manual submission rejected.",
                    PerformedBy = "Finance Manager",
                    PerformedRole = "Financial Manager",
                    CreatedAt = DateTime.UtcNow
                };
                _context.PaymentHistories.Add(history);
            }
        }

        await _context.SaveChangesAsync(default);

        return Ok(new
        {
            submission.Id,
            submission.Status,
            message = $"Submission status updated to '{request.Status}'."
        });
    }

    private async Task<string> GenerateNextOrNumberAsync()
    {
        var currentYear = DateTime.UtcNow.Year;
        var yearPrefix = $"OR-{currentYear}-";

        var lastPayment = await _context.Payments
            .AsNoTracking()
            .Where(p => p.OrNumber.StartsWith(yearPrefix))
            .OrderByDescending(p => p.OrNumber)
            .FirstOrDefaultAsync();

        int nextSeqNum = 1;
        if (lastPayment != null && lastPayment.OrNumber.Length > yearPrefix.Length)
        {
            var seqPart = lastPayment.OrNumber.Substring(yearPrefix.Length);
            if (int.TryParse(seqPart, out var lastSeq))
            {
                nextSeqNum = lastSeq + 1;
            }
        }

        return $"{yearPrefix}{nextSeqNum:D4}";
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Request DTOs
    // ──────────────────────────────────────────────────────────────────────────
    public record SubmitRequest(
        string InvoiceId,
        string? InvoiceNumber,
        string? ClientId,
        string? ClientName,
        string? PaymentMethod,
        string? ReferenceNumber,
        decimal AmountPaid,
        string? ProofFileName,
        string? ProofFileUrl
    );

    public record UpdateStatusRequest(string Status, string? Remarks);
}
