using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FOMS.Application.Interfaces;

namespace FOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/v1/[controller]")]
public class ShipmentRecordsController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;

    public ShipmentRecordsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetShipments()
    {
        var shipments = await _context.ShipmentRecords
            .Include(s => s.Client)
            .ToListAsync();
        return Ok(shipments);
    }
}
