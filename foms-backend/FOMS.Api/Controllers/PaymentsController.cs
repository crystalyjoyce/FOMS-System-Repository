using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FOMS.Application.Features;

namespace FOMS.Api.Controllers;

public class PaymentsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await Mediator.Send(new PaymentFeatures.GetPaymentsQuery());
        return Ok(payments);
    }

    [HttpPost]
    public async Task<IActionResult> RecordPayment([FromBody] PaymentFeatures.RecordPaymentCommand command)
    {
        var user = User.FindFirst("name")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown User";
        var updatedCommand = command with { RecordedBy = user };
        var payment = await Mediator.Send(updatedCommand);
        return Ok(payment);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePayment(string id)
    {
        var user = User.FindFirst("name")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown User";
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown Role";
        var result = await Mediator.Send(new PaymentFeatures.DeletePaymentCommand(id, user, role));
        if (!result) return NotFound();
        return Ok(new { success = true });
    }
}
