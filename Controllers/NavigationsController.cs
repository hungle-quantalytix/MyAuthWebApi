using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyAuthWebApi.Data;
using MyAuthWebApi.Models;

namespace MyAuthWebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NavigationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NavigationsController(ApplicationDbContext context)
    {
        _context = context;
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Navigation>>> GetNavigations()
    {
        return await _context.Navigations.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Navigation>> GetNavigation(int id)
    {
        return await _context.Navigations.FindAsync(id);
    }
    
    [HttpPost]
    public async Task<ActionResult<Navigation>> PostNavigation(Navigation navigation)
    {
        await _context.Navigations.AddAsync(navigation);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetNavigation), new { id = navigation.Id }, navigation);
    }
    
    [HttpPut("{id}")]
    public async Task<IActionResult> PutNavigation(int id, Navigation navigation)
    {
        if (id != navigation.Id)
        {
            return BadRequest();
        }
        _context.Entry(navigation).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNavigation(int id)
    {
        var navigation = await _context.Navigations.FindAsync(id);
        if (navigation == null)
        {
            return NotFound();
        }
        _context.Navigations.Remove(navigation);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}