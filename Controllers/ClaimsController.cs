using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyAuthWebApi.Data;
using MyAuthWebApi.Models;

namespace MyAuthWebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ClaimsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ClaimsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Claim>>> GetClaims()
    {
        return await _context.Claims.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Claim>> GetClaim(int id)
    {
        var claim = await _context.Claims.FindAsync(id);
        return claim;
    }

    [HttpPost]
    public async Task<ActionResult<Claim>> CreateClaim(Claim claim)
    {
        await _context.Claims.AddAsync(claim);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetClaim), new { id = claim.Id }, claim);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClaim(int id, Claim claim)
    {
        if (id != claim.Id)
        {
            return BadRequest();
        }
        _context.Entry(claim).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClaim(int id)
    {
        var claim = await _context.Claims.FindAsync(id);
        if (claim == null)
        {
            return NotFound();
        }
        _context.Claims.Remove(claim);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private bool ClaimExists(int id)
    {
        return _context.Claims.Any(e => e.Id == id);
    }

    [HttpGet("/api/users/get-claims")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<string>>> GetCurrentUserClaims()
    {
        var user = await _context.Users.Include(x => x.Claims).FirstOrDefaultAsync(x => x.Email == User.Identity.Name);
        if (user == null)
        {
            return BadRequest("User not found");
        }
        return user.Claims.Select(x => x.DisplayName).ToList();
    }
}