using System;
using Microsoft.AspNetCore.Identity;

class Program
{
    static void Main(string[] args)
    {
        var hasher = new PasswordHasher<object>();
        var hash = hasher.HashPassword(null, "Password@098");
        Console.WriteLine(hash);
    }
}
