using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FOMS.Application.Interfaces;
using FOMS.Application.Services;
using FOMS.Domain.Entities;

namespace FOMS.Application.Features;

public static class PaymentFeatures
{
    // ─────────────────────────────────────────────────────────────────
    // GET PAYMENTS
    // ─────────────────────────────────────────────────────────────────
    public record GetPaymentsQuery : IRequest<List<Payment>>;

    public class GetPaymentsQueryHandler : IRequestHandler<GetPaymentsQuery, List<Payment>>
    {
        private readonly IApplicationDbContext _context;

        public GetPaymentsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Payment>> Handle(GetPaymentsQuery request, CancellationToken cancellationToken)
        {
            return await _context.Payments.ToListAsync(cancellationToken);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // RECORD PAYMENT — with full validation guards (TASK 3, 4, 10)
    // ─────────────────────────────────────────────────────────────────
    public record RecordPaymentCommand(
        string OrNumber,
        string InvoiceId,
        string InvoiceNo,
        string ClientId,
        string ClientName,
        string PaymentDate,
        decimal Amount,
        string PaymentMethod,
        string ReferenceNumber,
        string? ProofImageUrl,
        string? Remarks,
        string RecordedBy
    ) : IRequest<Payment>;

    public class RecordPaymentCommandHandler : IRequestHandler<RecordPaymentCommand, Payment>
    {
        private readonly IApplicationDbContext _context;

        public RecordPaymentCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Payment> Handle(RecordPaymentCommand request, CancellationToken cancellationToken)
        {
            // Guard — Reference Number is required
            if (string.IsNullOrWhiteSpace(request.ReferenceNumber))
                throw new InvalidOperationException("Reference Number is required.");

            // Guard — Payment proof image is required
            if (string.IsNullOrWhiteSpace(request.ProofImageUrl))
                throw new InvalidOperationException("Payment proof image is required.");

            // ── TASK 3: Guard — Zero / Negative Payment ──────────────────────
            if (request.Amount <= 0m)
                throw new InvalidOperationException("Payment amount must be greater than zero.");

            // ── REVISION 1: Guard — Invalid Payment Method ───────────────────
            var validMethods = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Card", "GCash", "Maya" };
            if (!validMethods.Contains(request.PaymentMethod))
                throw new InvalidOperationException($"Invalid payment method '{request.PaymentMethod}'. Allowed methods: Card, GCash, Maya.");

            // ── TASK 3: Guard — Duplicate OR Number ──────────────────────────
            var orExists = await _context.Payments
                .AnyAsync(p => p.OrNumber == request.OrNumber, cancellationToken);
            if (orExists)
                throw new InvalidOperationException(
                    $"Official Receipt number '{request.OrNumber}' already exists. Each payment must have a unique OR number.");

            // ── TASK 3: Guard — Duplicate Reference Number per Invoice ────────
            if (!string.IsNullOrWhiteSpace(request.ReferenceNumber))
            {
                var refExists = await _context.Payments
                    .AnyAsync(p => p.ReferenceNumber == request.ReferenceNumber
                                   && p.InvoiceId == request.InvoiceId,
                              cancellationToken);
                if (refExists)
                    throw new InvalidOperationException(
                        $"Reference number '{request.ReferenceNumber}' has already been used for this invoice.");
            }

            // ── Fetch Invoice ─────────────────────────────────────────────────
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == request.InvoiceId, cancellationToken);
            if (invoice == null)
                throw new InvalidOperationException($"Invoice '{request.InvoiceId}' not found.");

            // ── TASK 4: Guard — Overpayment ───────────────────────────────────
            var validationError = BillingComputationService.ValidatePaymentAmount(request.Amount, invoice.Balance);
            if (validationError != null)
                throw new InvalidOperationException(validationError);

            // ── Record the payment ────────────────────────────────────────────
            var beforeBalance = invoice.Balance;
            var beforeStatus = invoice.PaymentStatus;

            var payment = new Payment
            {
                OrNumber = request.OrNumber,
                InvoiceId = request.InvoiceId,
                InvoiceNo = request.InvoiceNo,
                ClientId = request.ClientId,
                ClientName = request.ClientName,
                PaymentDate = request.PaymentDate,
                Amount = request.Amount,
                PaymentMethod = request.PaymentMethod,
                ReferenceNumber = request.ReferenceNumber,
                ProofImageUrl = request.ProofImageUrl,
                Remarks = request.Remarks,
                RecordedBy = request.RecordedBy,
                DateRecorded = DateTime.UtcNow.ToString("yyyy-MM-dd")
            };

            // ── TASK 8 & 10: Update Invoice using BillingComputationService ───
            invoice.AmountPaid += request.Amount;
            BillingComputationService.RecalculateInvoice(invoice);
            invoice.UpdatedBy = request.RecordedBy;

            // ── TASK 11: Create Official Receipt via PaymentCollection ─────────
            var paymentCollection = new PaymentCollection
            {
                InvoiceId = invoice.Id,
                CollectedDate = DateTime.UtcNow,
                AmountCollected = request.Amount,
                PaymentMethod = request.PaymentMethod,
                Status = "Completed"
            };
            _context.PaymentCollections.Add(paymentCollection);

            var officialReceipt = new OfficialReceipt
            {
                PaymentCollectionId = paymentCollection.Id,
                ReceiptNumber = request.OrNumber,
                IssuedDate = DateTime.UtcNow
            };
            _context.OfficialReceipts.Add(officialReceipt);

            // ── TASK 17: Audit Log with Before/After values ────────────────────
            var audit = new AuditLog
            {
                UserId = request.RecordedBy,
                EntityName = "Payment",
                EntityId = payment.Id,
                Action = "Record Payment",
                Details = $"Recorded payment of {request.Amount:N2} for invoice {request.InvoiceNo} " +
                          $"(OR: {request.OrNumber}). Method: {request.PaymentMethod}. " +
                          $"Status: {invoice.PaymentStatus}.",
                BeforeValue = $"Balance: {beforeBalance:N2} | Status: {beforeStatus}",
                AfterValue = $"Balance: {invoice.Balance:N2} | Status: {invoice.PaymentStatus}"
            };
            await _context.AuditLogs.AddAsync(audit, cancellationToken);

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync(cancellationToken);

            // Sync Billing Invoice and ReceivableBalance
            await BillingComputationService.SyncBillingInvoiceAndReceivableAsync(invoice, _context, cancellationToken);

            // ── TASK 12: Sync client balance authoritatively ───────────────────
            await BillingComputationService.SyncClientBalanceAsync(request.ClientId, _context, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return payment;
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // DELETE PAYMENT — revert invoice and sync balance
    // ─────────────────────────────────────────────────────────────────
    public record DeletePaymentCommand(string Id, string User, string Role) : IRequest<bool>;

    public class DeletePaymentCommandHandler : IRequestHandler<DeletePaymentCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeletePaymentCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeletePaymentCommand request, CancellationToken cancellationToken)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
            if (payment == null) return false;

            // Revert Invoice
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == payment.InvoiceId, cancellationToken);
            if (invoice != null)
            {
                var beforeBalance = invoice.Balance;
                var beforeStatus = invoice.PaymentStatus;

                invoice.AmountPaid = Math.Max(0m, invoice.AmountPaid - payment.Amount);
                BillingComputationService.RecalculateInvoice(invoice);
                invoice.UpdatedBy = $"{request.User} ({request.Role})";

                var audit = new AuditLog
                {
                    UserId = $"{request.User} ({request.Role})",
                    EntityName = "Payment",
                    EntityId = payment.Id,
                    Action = "Delete Payment",
                    Details = $"Deleted payment of {payment.Amount:N2} for invoice {payment.InvoiceNo} (OR: {payment.OrNumber}).",
                    BeforeValue = $"Balance: {beforeBalance:N2} | Status: {beforeStatus}",
                    AfterValue = $"Balance: {invoice.Balance:N2} | Status: {invoice.PaymentStatus}"
                };
                await _context.AuditLogs.AddAsync(audit, cancellationToken);
            }

            // Remove associated PaymentCollection and OfficialReceipt
            var collection = await _context.PaymentCollections
                .FirstOrDefaultAsync(c => c.InvoiceId == payment.InvoiceId
                                          && c.AmountCollected == payment.Amount,
                                     cancellationToken);
            if (collection != null)
            {
                var receipt = await _context.OfficialReceipts
                    .FirstOrDefaultAsync(r => r.PaymentCollectionId == collection.Id, cancellationToken);
                if (receipt != null) _context.OfficialReceipts.Remove(receipt);
                _context.PaymentCollections.Remove(collection);
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync(cancellationToken);

            // TASK 12: Sync client balance after reversal
            if (invoice != null)
            {
                // Sync Billing Invoice and ReceivableBalance
                await BillingComputationService.SyncBillingInvoiceAndReceivableAsync(invoice, _context, cancellationToken);

                await BillingComputationService.SyncClientBalanceAsync(payment.ClientId, _context, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return true;
        }
    }
}
