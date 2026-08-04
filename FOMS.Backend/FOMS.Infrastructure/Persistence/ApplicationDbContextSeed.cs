using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FOMS.Domain.Entities;

namespace FOMS.Infrastructure.Persistence;

public static class ApplicationDbContextSeed
{
    public static async Task SeedSampleDataAsync(ApplicationDbContext context)
    {
        // 1. Seed Employees
        var demoEmployees = new List<Employee>
        {
            new Employee
            {
                Id = "EMP-001",
                Name = "Crystalyn Joyce C. Fajardo",
                Role = "Finance Manager",
                Email = "crystalyn@foms.local",
                SystemAccess = "Finance Operation Service",
                Status = "Active",
                IsActive = true,
                Username = "EMP-001",
                PasswordHash = FOMS.Application.Services.AuthService.HashPassword("Password@123")
            },
            new Employee
            {
                Id = "EMP-002",
                Name = "Misty",
                Role = "Head Accountant",
                Email = "misty@foms.local",
                SystemAccess = "Finance Operation Service",
                Status = "Active",
                IsActive = true,
                Username = "EMP-002",
                PasswordHash = FOMS.Application.Services.AuthService.HashPassword("Password@123")
            },
            new Employee
            {
                Id = "EMP-003",
                Name = "Maria Mariel Jane Anonuevo",
                Role = "Accountant",
                Email = "mariel@foms.local",
                SystemAccess = "Finance Operation Service",
                Status = "Active",
                IsActive = true,
                Username = "EMP-003",
                PasswordHash = FOMS.Application.Services.AuthService.HashPassword("Password@123")
            },
            new Employee
            {
                Id = "EMP-004",
                Name = "Hannah Estrera",
                Role = "Coordinator",
                Email = "hannah@foms.local",
                SystemAccess = "Finance Operation Service",
                Status = "Active",
                IsActive = true,
                Username = "EMP-004",
                PasswordHash = FOMS.Application.Services.AuthService.HashPassword("Password@123")
            },
            new Employee
            {
                Id = "EMP-005",
                Name = "Joana Marie Ogaya",
                Role = "Financial Manager",
                Email = "joana@foms.local",
                SystemAccess = "Finance Operation Service",
                Status = "Active",
                IsActive = true,
                Username = "EMP-005",
                PasswordHash = FOMS.Application.Services.AuthService.HashPassword("Password@123")
            }
        };

        foreach (var demoEmployee in demoEmployees)
        {
            var existingEmployee = await context.Employees.FirstOrDefaultAsync(e => e.Id == demoEmployee.Id);
            if (existingEmployee != null)
            {
                existingEmployee.Name = demoEmployee.Name;
                existingEmployee.Role = demoEmployee.Role;
                existingEmployee.Email = demoEmployee.Email;
                existingEmployee.SystemAccess = demoEmployee.SystemAccess;
                existingEmployee.Status = demoEmployee.Status;
                existingEmployee.IsActive = demoEmployee.IsActive;
                existingEmployee.Username = demoEmployee.Username;

                if (!existingEmployee.PasswordHash.StartsWith("PBKDF2$"))
                {
                    existingEmployee.PasswordHash = demoEmployee.PasswordHash;
                }
            }
            else
            {
                context.Employees.Add(demoEmployee);
            }
        }

        var seedIds = demoEmployees.Select(e => e.Id).ToList();
        var extraEmployees = await context.Employees.Where(e => !seedIds.Contains(e.Id)).ToListAsync();
        if (extraEmployees.Any())
        {
            context.Employees.RemoveRange(extraEmployees);
        }

        await context.SaveChangesAsync();

        // 2. Seed Clients
        if (!await context.Clients.AnyAsync())
        {
            var clientList = new List<Client>
            {
                new Client { Id = "CL-001", ClientCode = "LZD-001", Name = "Lazada Philippines", BusinessName = "Lazada E-Services Philippines, Inc.", ContactPerson = "Maria Dela Cruz", ContactNumber = "0917-123-4567", Email = "finance@lazada.com.ph", Address = "Rockwell Dr., Brgy. Poblacion, Makati City", Tin = "123-456-789-000", CreditLimit = 500000, Status = "Active", DateRegistered = "2024-11-26", LastTransaction = "2026-05-18", CurrentBalance = 85300, TotalBilled = 124200, TotalPaid = 38900 },
                new Client { Id = "CL-002", ClientCode = "SHP-002", Name = "Shopee Express", BusinessName = "Shopee Xpress PH, Inc.", ContactPerson = "Jose Santos", ContactNumber = "0917-555-9876", Email = "ap@shopee.ph", Address = "Ayala Ave., Makati City", Tin = "987-654-321-000", CreditLimit = 450000, Status = "Active", DateRegistered = "2024-12-26", LastTransaction = "2026-05-19", CurrentBalance = 52500, TotalBilled = 86200, TotalPaid = 33700 },
                new Client { Id = "CL-003", ClientCode = "TTS-003", Name = "TikTok Shop", BusinessName = "TikTok Shop Philippines, Inc.", ContactPerson = "Robert Lim", ContactNumber = "0917-333-4444", Email = "billing@tiktok.ph", Address = "BGC High St., Taguig City", Tin = "321-654-987-000", CreditLimit = 300000, Status = "Active", DateRegistered = "2025-01-25", LastTransaction = "2026-05-12", CurrentBalance = 36350, TotalBilled = 56350, TotalPaid = 20000 },
                new Client { Id = "CA-001", ClientCode = "CA-001", Name = "Lazada Account", BusinessName = "Lazada E-Services Philippines, Inc.", ContactPerson = "Maria Dela Cruz", Email = "finance@lazada.com.ph", ContactNumber = "0917-123-4567", Address = "Rockwell Dr., Brgy. Poblacion, Makati City", Status = "Active", CreditLimit = 500000, CurrentBalance = 53200, DateRegistered = "2024-11-26" },
                new Client { Id = "CA-002", ClientCode = "CA-002", Name = "Shopee Express Account", BusinessName = "Shopee Xpress PH, Inc.", ContactPerson = "Jose Santos", Email = "ap@shopee.ph", ContactNumber = "0917-555-9876", Address = "Ayala Ave., Makati City", Status = "Active", CreditLimit = 450000, CurrentBalance = 45000, DateRegistered = "2024-12-26" }
            };
            context.Clients.AddRange(clientList);
            await context.SaveChangesAsync();
        }

        // 3. Seed ShipmentRecords
        if (!await context.ShipmentRecords.AnyAsync())
        {
            var records = new List<ShipmentRecord>
            {
                new ShipmentRecord { Id = "SR-001", ClientId = "CA-001", Origin = "Manila", Destination = "Cebu", WeightKg = 12.5m, Cost = 7500.00m, Status = "Completed", ShipmentDate = DateTime.UtcNow.AddDays(-15) },
                new ShipmentRecord { Id = "SR-002", ClientId = "CA-001", Origin = "Manila", Destination = "Davao", WeightKg = 25.0m, Cost = 1555.00m, Status = "Completed", ShipmentDate = DateTime.UtcNow.AddDays(-10) }
            };
            context.ShipmentRecords.AddRange(records);
            await context.SaveChangesAsync();
        }

        // 4. Seed Invoices
        if (!await context.Invoices.AnyAsync())
        {
            var invoices = new List<Invoice>
            {
                new Invoice { Id = "INV-001", InvoiceNo = "LZD-2026-0001", ClientId = "CA-001", ClientName = "Lazada Philippines", BillingDate = DateTime.UtcNow.ToString("yyyy-MM-dd"), DueDate = DateTime.UtcNow.AddDays(30).ToString("yyyy-MM-dd"), FreightCharges = 47500.00m, Subtotal = 47500.00m, VatRate = 0.12, VatAmount = 5700.00m, TotalAmount = 53200.00m, AmountPaid = 0m, Balance = 53200.00m, PaymentStatus = "Unpaid", Description = "Monthly Freight Shipping Services" },
                new Invoice { Id = "INV-002", InvoiceNo = "SHP-2026-0001", ClientId = "CL-002", ClientName = "Shopee Express", BillingDate = DateTime.UtcNow.ToString("yyyy-MM-dd"), DueDate = DateTime.UtcNow.AddDays(30).ToString("yyyy-MM-dd"), FreightCharges = 35000.00m, Subtotal = 35000.00m, VatRate = 0.12, VatAmount = 4200.00m, TotalAmount = 39200.00m, AmountPaid = 20400.00m, Balance = 18800.00m, PaymentStatus = "Partially Paid", Description = "Cargo Forwarding" }
            };
            context.Invoices.AddRange(invoices);
            await context.SaveChangesAsync();
        }

        // 5. Seed Payments
        if (!await context.Payments.AnyAsync())
        {
            var payments = new List<Payment>
            {
                new Payment { Id = "PAY-001", OrNumber = "OR-2026-001", InvoiceId = "INV-002", InvoiceNo = "SHP-2026-0001", ClientId = "CL-002", ClientName = "Shopee Express", Amount = 20400.00m, PaymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd"), PaymentMethod = "Bank Transfer", ReferenceNumber = "REF-10029", RecordedBy = "Misty", Remarks = "Initial partial payment" }
            };
            context.Payments.AddRange(payments);
            await context.SaveChangesAsync();
        }

        // 6. Seed CashFlowTransactions
        if (!await context.CashFlowTransactions.AnyAsync())
        {
            var cf = new CashFlowTransaction
            {
                Id = "CF-001",
                Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Description = "Client Collection - Shopee Express",
                Amount = 20400.00m,
                Type = "Inflow",
                Category = "Collections",
                ReferenceNo = "OR-2026-001"
            };
            context.CashFlowTransactions.Add(cf);
            await context.SaveChangesAsync();
        }

        await context.SaveChangesAsync();
    }
}
