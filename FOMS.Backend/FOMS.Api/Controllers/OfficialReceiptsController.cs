using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FOMS.Application.Interfaces;
using FOMS.Domain.Entities;

namespace FOMS.Api.Controllers;

[Authorize]
[Route("api/official-receipts")]
[ApiController]
public class OfficialReceiptsController : ControllerBase
{
    private readonly IRepository<OfficialReceipt> _repository;
    private readonly IApplicationDbContext _context;

    public OfficialReceiptsController(IRepository<OfficialReceipt> repository, IApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    [Authorize(Roles = "Accountant,Bookkeeper,Cashier")]
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repository.GetAllAsync());

    [Authorize(Roles = "Accountant,Bookkeeper,Cashier")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _repository.GetByIdAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Bookkeeper,Cashier")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OfficialReceipt request)
    {
        await _repository.AddAsync(request);
        await _context.SaveChangesAsync(default);
        return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
    }
}
