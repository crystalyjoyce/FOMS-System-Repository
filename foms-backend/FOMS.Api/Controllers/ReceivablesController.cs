using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FOMS.Application.Interfaces;
using FOMS.Application.Services;
using FOMS.Domain.Entities;

namespace FOMS.Api.Controllers;

[Authorize]
[Route("api/receivables")]
[Route("api/v1/receivables")]
[ApiController]
public class ReceivablesController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public ReceivablesController(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GET /api/receivables â€” Returns all ReceivableBalance records projected to safe DTOs
    /// (avoids circular reference serialization from navigation properties).
    /// </summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetReceivables()
    {
        var receivables = await _context.ReceivableBalances
            .ToListAsync();

        // Project to a safe DTO to avoid circular reference serialization issues
        // (Client.Receivables -> ReceivableBalance.Client -> Client...)
        var result = receivables.Select(r => new
        {
            r.Id,
            r.ClientId,
            r.InvoiceId,
            r.BalanceAmount,
            r.DueDate,
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// GET /api/receivables/outstanding â€” Live computation of outstanding balances
    /// from the Invoices table with dynamic aging refresh.
    /// This is the authoritative endpoint for the Outstanding Balances page.
    /// </summary>
    [Authorize]
    [HttpGet("outstanding")]
    public async Task<IActionResult> GetOutstandingBalances()
    {
        var invoices = await _context.Invoices
            .Where(i => !i.Archived)
            .ToListAsync();

        // Dynamically refresh aging, overdue status, and balance on every GET
        foreach (var invoice in invoices)
        {
            BillingComputationService.RefreshInvoiceAging(invoice);
        }

        // Only return invoices with an outstanding balance > 0
        var outstanding = invoices
            .Where(i => i.Balance > 0)
            .OrderByDescending(i => i.DaysOverdue)
            .ToList();

        return Ok(outstanding);
    }

    /// <summary>
    /// GET /api/receivables/summary â€” Aggregate totals for the Bookkeeper dashboard.
    /// </summary>
    [Authorize]
    [HttpGet("summary")]
    public async Task<IActionResult> GetOutstandingSummary()
    {
        var invoices = await _context.Invoices
            .Where(i => !i.Archived)
            .ToListAsync();

        foreach (var invoice in invoices)
        {
            BillingComputationService.RefreshInvoiceAging(invoice);
        }

        var outstanding = invoices.Where(i => i.Balance > 0).ToList();

        var summary = new
        {
            TotalOutstanding = outstanding.Sum(i => i.Balance),
            TotalOverdue = outstanding.Where(i => i.DaysOverdue > 0).Sum(i => i.Balance),
            TotalCurrent = outstanding.Where(i => i.DaysOverdue == 0).Sum(i => i.Balance),
            InvoiceCount = outstanding.Count,
            OverdueCount = outstanding.Count(i => i.DaysOverdue > 0),
            Buckets = new
            {
                Current = outstanding.Where(i => i.AgingBucket == "Current").Sum(i => i.Balance),
                Days1_30 = outstanding.Where(i => i.AgingBucket == "1-30").Sum(i => i.Balance),
                Days31_60 = outstanding.Where(i => i.AgingBucket == "31-60").Sum(i => i.Balance),
                Days61_90 = outstanding.Where(i => i.AgingBucket == "61-90").Sum(i => i.Balance),
                Days90Plus = outstanding.Where(i => i.AgingBucket == "90+").Sum(i => i.Balance),
            }
        };

        return Ok(summary);
    }

    /// <summary>
    /// GET /api/receivables/aging-accounts â€” Returns aging accounts with dynamically refreshed DaysPastDue.
    /// </summary>
    [Authorize]
    [HttpGet("aging-accounts")]
    public async Task<IActionResult> GetAgingAccounts()
    {
        var invoices = await _context.Invoices
            .Where(i => !i.Archived && i.Balance > 0)
            .ToListAsync();

        // Refresh aging dynamically â€” AgingAccounts DB table may be stale
        foreach (var invoice in invoices)
        {
            BillingComputationService.RefreshInvoiceAging(invoice);
        }

        // Project to a fresh aging view from invoice data (authoritative)
        var aging = invoices
            .GroupBy(i => i.ClientId)
            .Select(g => new
            {
                ClientId = g.Key,
                ClientName = g.First().ClientName,
                TotalBalance = g.Sum(i => i.Balance),
                DaysPastDue = g.Max(i => i.DaysOverdue),
                AgingBucket = g.OrderByDescending(i => i.DaysOverdue).First().AgingBucket,
                Status = g.OrderByDescending(i => i.DaysOverdue).First().PaymentStatus,
            })
            .OrderByDescending(a => a.DaysPastDue)
            .ToList();

        return Ok(aging);
    }

    /// <summary>
    /// GET /api/receivables/overdue-accounts â€” Returns clients with overdue invoices (DaysOverdue > 0).
    /// </summary>
    [Authorize]
    [HttpGet("overdue-accounts")]
    public async Task<IActionResult> GetOverdueAccounts()
    {
        var invoices = await _context.Invoices
            .Where(i => !i.Archived && i.Balance > 0)
            .ToListAsync();

        foreach (var invoice in invoices)
        {
            BillingComputationService.RefreshInvoiceAging(invoice);
        }

        var overdue = invoices
            .Where(i => i.DaysOverdue > 0)
            .GroupBy(i => i.ClientId)
            .Select(g => new
            {
                ClientId = g.Key,
                ClientName = g.First().ClientName,
                TotalBalance = g.Sum(i => i.Balance),
                DaysPastDue = g.Max(i => i.DaysOverdue),
                AgingBucket = g.OrderByDescending(i => i.DaysOverdue).First().AgingBucket,
                InvoiceCount = g.Count(),
            })
            .OrderByDescending(a => a.DaysPastDue)
            .ToList();

        return Ok(overdue);
    }

    /// <summary>
    /// GET /api/receivables/{clientId} â€” Returns outstanding balance details for a specific client.
    /// Accepts both CL- (frontend) and CA- (billing account) prefixed client IDs.
    /// </summary>
    [Authorize]
    [HttpGet("{clientId}")]
    public async Task<IActionResult> GetClientOutstanding(string clientId)
    {
        // Normalize: build both CL- and CA- variant to search across both ID namespaces
        var altClientId = clientId.StartsWith("CL-")
            ? clientId.Replace("CL-", "CA-")
            : clientId.StartsWith("CA-")
                ? clientId.Replace("CA-", "CL-")
                : clientId;

        var invoices = await _context.Invoices
            .Where(i => (i.ClientId == clientId || i.ClientId == altClientId) && !i.Archived && i.Balance > 0)
            .ToListAsync();

        foreach (var invoice in invoices)
        {
            BillingComputationService.RefreshInvoiceAging(invoice);
        }

        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId || c.Id == altClientId);

        var result = new
        {
            ClientId = clientId,
            ClientName = client?.Name ?? invoices.FirstOrDefault()?.ClientName ?? "Unknown",
            TotalOutstanding = invoices.Sum(i => i.Balance),
            Invoices = invoices.OrderByDescending(i => i.DaysOverdue).ToList()
        };

        return Ok(result);
    }

    /// <summary>
    /// POST /api/receivables â€” Manually create a ReceivableBalance record (Accountant only).
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReceivableBalance request)
    {
        await _context.ReceivableBalances.AddAsync(request);
        await _context.SaveChangesAsync(default);
        return CreatedAtAction(nameof(GetReceivables), new { id = request.Id }, request);
    }
}
