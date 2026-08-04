using System;

namespace FOMS.Domain.Entities;

public class ShipmentRate
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public decimal BaseFare { get; set; }
    public decimal RatePerKg { get; set; }
    public decimal RatePerCbm { get; set; }
    public int EstimatedDays { get; set; }
}
