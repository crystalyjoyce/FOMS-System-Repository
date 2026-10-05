using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FOMS.Application.Features;
using FOMS.Application.Interfaces;

namespace FOMS.Api.Controllers;

[Route("api/[controller]")]
[Route("api/v1/[controller]")]
[Route("api/billing-invoices")]
public class InvoicesController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;

    public InvoicesController(IApplicationDbContext context)
    {
        _context = context;
    }

    [AllowAnonymous]
    [HttpGet("lookup/{invoiceNo}")]
    public async Task<IActionResult> LookupInvoice(string invoiceNo)
    {
        var normalized = invoiceNo;
        if (normalized != null && normalized.StartsWith("INV-"))
        {
            normalized = "BI-" + normalized.Substring(4);
        }

        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.InvoiceNo == normalized || i.InvoiceNo == invoiceNo);

        if (invoice == null)
        {
            return NotFound(new { message = "Invoice not found. Please verify the invoice number." });
        }

        return Ok(invoice);
    }
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetInvoices()
    {
        var invoices = await Mediator.Send(new InvoiceFeatures.GetInvoicesQuery());
        return Ok(invoices);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] InvoiceFeatures.CreateInvoiceCommand command)
    {
        var user = User.FindFirst("name")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown User";
        var updatedCommand = command with { EncodedBy = user };
        var invoice = await Mediator.Send(updatedCommand);
        return Ok(invoice);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvoice(string id)
    {
        var deletedBy = User.FindFirst("name")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown User";
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Unknown Role";
        var result = await Mediator.Send(new InvoiceFeatures.DeleteInvoiceCommand(id, deletedBy, userRole));
        if (!result) return NotFound();
        return Ok(new { success = true });
    }

    public record InvoiceArchiveRequest(bool Archived);

    [Authorize]
    [HttpPut("{id}/archive")]
    public async Task<IActionResult> ArchiveInvoice(string id, [FromBody] InvoiceArchiveRequest request)
    {
        var user = User.FindFirst("name")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown User";
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Unknown Role";
        var result = await Mediator.Send(new InvoiceFeatures.ArchiveInvoiceCommand(id, request.Archived, user, role));
        if (!result) return NotFound();
        return Ok(new { success = true });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateInvoice(string id, [FromBody] InvoiceFeatures.UpdateInvoiceCommand command)
    {
        if (id != command.Id) return BadRequest(new { message = "ID mismatch" });
        var user = User.FindFirst("name")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown User";
        var updatedCommand = command with { UpdatedBy = user };
        var invoice = await Mediator.Send(updatedCommand);
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }
}
