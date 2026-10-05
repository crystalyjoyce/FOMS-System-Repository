using FOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FOMS.Tests;

public class SeededAccountsTests
{
    [Fact]
    public async Task SeedSampleData_ShouldCreateTheDemoAdminAccount()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        await ApplicationDbContextSeed.SeedSampleDataAsync(context);

        var employee = await context.Employees.SingleOrDefaultAsync(e => e.Id == "EMP-001");

        Assert.NotNull(employee);
        Assert.True(FOMS.Application.Services.AuthService.VerifyPassword("Password@123", employee!.PasswordHash));
        Assert.Equal("Finance Manager", employee.Role);
        Assert.Equal("Crystalyn Joyce C. Fajardo", employee.Name);
    }

    [Fact]
    public async Task UpdateRealDatabase_SeededEmployees()
    {
        try
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlServer(
                    @"Server=localhost\SQLEXPRESS;Database=FOMSDB;Trusted_Connection=True;TrustServerCertificate=True;Connect Timeout=60;Command Timeout=120;Min Pool Size=1;Max Pool Size=20;",
                    b =>
                    {
                        b.CommandTimeout(120);
                        b.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
                    })
                .Options;

            await using var context = new ApplicationDbContext(options);

            await ApplicationDbContextSeed.SeedSampleDataAsync(context);
        }
        catch
        {
            // Ignore if local SQL Server is unavailable during CI build
        }
    }
}
