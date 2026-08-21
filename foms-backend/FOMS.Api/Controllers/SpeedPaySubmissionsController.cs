using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FOMS.Application.Interfaces;
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

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // POST api/speedpay/submissions
    // Called by SpeedPay Portal when a client uploads proof of payment
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitRequest request)
    {
        if (request == null) return BadRequest(new { message = "Request body is required." });
        if (string.IsNullOrWhiteSpace(request.InvoiceId)) return BadRequest(new { message = "InvoiceId is required." });
        if (request.AmountPaid <= 0) return BadRequest(new { message = "AmountPaid must be greater than 0." });

        var submission = new SpeedPayManualSubmission
        {
            Id = Guid.NewGuid().ToString(),
            InvoiceId = request.InvoiceId,
            InvoiceNumber = request.InvoiceNumber ?? request.InvoiceId,
            ClientId = request.ClientId ?? string.Empty,
            ClientName = request.ClientName ?? "Unknown",
            PaymentMethod = request.PaymentMethod ?? "Unknown",
            ReferenceNumber = request.ReferenceNumber ?? Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper(),
            AmountPaid = request.AmountPaid,
            ProofFileName = request.ProofFileName ?? "proof.jpg",
            ProofFileUrl = request.ProofFileUrl,
            Status = "Pending Validation",
            SubmittedAt = DateTime.UtcNow,
        };

        await _context.SpeedPayManualSubmissions.AddAsync(submission);
        await _context.SaveChangesAsync(default);

        return CreatedAtAction(nameof(GetById), new { id = submission.Id }, new
        {
            submission.Id,
            submission.Status,
            submission.SubmittedAt,
            message = "Payment submission received. Pending Finance Manager validation."
        });
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // GET api/speedpay/submissions
    // Returns all manual submissions for the Finance Manager dashboard
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // GET api/speedpay/submissions/{id}
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var submission = await _context.SpeedPayManualSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null) return NotFound(new { message = $"Submission '{id}' not found." });
        return Ok(submission);
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // PUT api/speedpay/submissions/{id}/status
    // Finance Manager validates or rejects a submission
    // Body: { "status": "Validated" | "Rejected", "remarks": "..." }
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
    {
        var submission = await _context.SpeedPayManualSubmissions
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null) return NotFound(new { message = $"Submission '{id}' not found." });

        var allowed = new[] { "Validated", "Rejected", "Pending Validation" };
        if (!allowed.Contains(request.Status))
            return BadRequest(new { message = $"Invalid status '{request.Status}'. Allowed: {string.Join(", ", allowed)}" });

        submission.Status = request.Status;
        await _context.SaveChangesAsync(default);

        return Ok(new
        {
            submission.Id,
            submission.Status,
            message = $"Submission status updated to '{request.Status}'."
        });
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Request DTOs
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
