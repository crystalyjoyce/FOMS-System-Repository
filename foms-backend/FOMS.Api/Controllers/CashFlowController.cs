using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FOMS.Application.Features;
using FOMS.Application.Interfaces;
using FOMS.Domain.Entities;

namespace FOMS.Api.Controllers;

[Authorize]
[Route("api/cash-flow")]
[Route("api/v1/cashflow")]
[Route("api/v1/cash-flow")]
[ApiController]
public class CashFlowController : ApiControllerBase
{
    private readonly IRepository<CashFlowTransaction> _repository;
    private readonly IApplicationDbContext _context;

    public CashFlowController(IRepository<CashFlowTransaction> repository, IApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    [Authorize(Roles = "Accountant,Cashier")]
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repository.GetAllAsync());

    [Authorize(Roles = "Accountant,Cashier")]
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var inflow = await _context.CashFlowTransactions.Where(t => t.Type == "Inflow").SumAsync(t => t.Amount);
        var outflow = await _context.CashFlowTransactions.Where(t => t.Type == "Outflow").SumAsync(t => t.Amount);
        return Ok(new { Inflow = inflow, Outflow = outflow });
    }

    [Authorize(Roles = "Accountant,Cashier")]
    [HttpGet("balances")]
    public async Task<IActionResult> GetBalances()
    {
        var balances = await Mediator.Send(new CashFlowFeatures.GetBankBalancesQuery());
        return Ok(balances);
    }

    [Authorize(Roles = "Cashier")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CashFlowTransaction request)
    {
        var addedBy = User.FindFirst("name")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown User";
        var command = new CashFlowFeatures.AddCashFlowCommand(
            Type: request.Type,
            Category: request.Category,
            Amount: request.Amount,
            ReferenceNo: request.ReferenceNo,
            Description: request.Description,
            AddedBy: addedBy
        );
        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }
}
