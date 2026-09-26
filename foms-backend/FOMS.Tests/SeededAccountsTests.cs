using FOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FOMS.Tests;

public class SeededAccountsTests
{
    [Fact]
    public async Task SeedSampleData_ShouldCreateAllPermanentStaffAccounts()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        await ApplicationDbContextSeed.SeedSampleDataAsync(context);

        var emp1 = await context.Employees.SingleOrDefaultAsync(e => e.Id == "EMP-001");
        Assert.NotNull(emp1);
        Assert.Equal("Crystalyn Joyce C. Fajardo", emp1!.Name);
        Assert.Equal("Finance Manager", emp1.Role);

        var emp2 = await context.Employees.SingleOrDefaultAsync(e => e.Id == "EMP-002");
        Assert.NotNull(emp2);
        Assert.Equal("Mariel Maricel Anonuevo", emp2!.Name);
        Assert.Equal("Head Accountant", emp2.Role);

        var emp3 = await context.Employees.SingleOrDefaultAsync(e => e.Id == "EMP-003");
        Assert.NotNull(emp3);
        Assert.Equal("Misty", emp3!.Name);
        Assert.Equal("Accountant", emp3.Role);

        var emp4 = await context.Employees.SingleOrDefaultAsync(e => e.Id == "EMP-004");
        Assert.NotNull(emp4);
        Assert.Equal("Joana Marie Chan Ogaya", emp4!.Name);
        Assert.Equal("Coordinator", emp4.Role);

        var emp5 = await context.Employees.SingleOrDefaultAsync(e => e.Id == "EMP-005");
        Assert.NotNull(emp5);
        Assert.Equal("Hannah Marie Estrera", emp5!.Name);
        Assert.Equal("Assistant of Finance Manager", emp5.Role);

        var emp6 = await context.Employees.SingleOrDefaultAsync(e => e.Id == "EMP-006");
        Assert.NotNull(emp6);
        Assert.Equal("Client", emp6!.Name);
        Assert.Equal("Client", emp6.Role);
    }
}
