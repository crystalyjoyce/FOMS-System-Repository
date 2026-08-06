using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FOMS.Application.DTOs;
using FOMS.Application.Interfaces;

namespace FOMS.Api.Controllers;

/// <summary>
/// Handles authentication for FOMS: login, logout, token refresh, profile, 
/// password change, and account unlock.
///
/// Security notes:
/// - All error messages are intentionally generic to prevent information leakage.
/// - Exception handling is delegated to the global exception middleware in Program.cs.
/// - Unlock requires Accountant role — enforced at both controller AND service level.
/// </summary>
[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // Public — no token required
    // ─────────────────────────────────────────────────────────────────────────
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Username and password are required." });

        // Exceptions (UnauthorizedAccessException) are caught by the global handler in Program.cs
        var result = await _authService.LoginAsync(request.Username, request.Password);
        return Ok(new { success = true, data = result });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/logout
    // Requires valid JWT
    // ─────────────────────────────────────────────────────────────────────────
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "RefreshToken is required." });

        var success = await _authService.LogoutAsync(request.RefreshToken);
        if (!success)
            return BadRequest(new { success = false, message = "Invalid refresh token." });

        return NoContent();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/refresh
    // Public — accepts a refresh token, issues a new access token
    // ─────────────────────────────────────────────────────────────────────────
    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "RefreshToken is required." });

        var result = await _authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(new { success = true, data = result });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/auth/me
    // Requires valid JWT — returns the currently authenticated user's profile
    // ─────────────────────────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "Could not identify user." });

        var profile = await _authService.GetProfileAsync(userId);
        if (profile == null)
            return Unauthorized(new { success = false, message = "User not found." });

        return Ok(new { success = true, data = profile });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/change-password
    // Requires valid JWT — authenticated user changes their own password
    // ─────────────────────────────────────────────────────────────────────────
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Current password and a new password of at least 8 characters are required." });

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "Could not identify user." });

        await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
        return Ok(new { success = true, message = "Password changed successfully." });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/unlock/{userId}
    // Requires Accountant role — admin unlocks a locked employee account
    // ─────────────────────────────────────────────────────────────────────────
    [Authorize(Roles = "Accountant")]
    [HttpPost("unlock/{userId}")]
    public async Task<IActionResult> UnlockAccount(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest(new { success = false, message = "User ID is required." });

        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                      ?? "Unknown";

        var result = await _authService.UnlockAccountAsync(userId, adminId);
        if (!result)
            return NotFound(new { success = false, message = $"User '{userId}' not found." });

        return Ok(new { success = true, message = $"Account '{userId}' has been unlocked." });
    }
}
