using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyAuthWebApi.Attributes;
using MyAuthWebApi.Data;
using MyAuthWebApi.Models;

namespace MyAuthWebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CategoriesController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    [RequirePermission("Read", nameof(Category))]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        return await context.Categories.Include(x => x.Products).ToListAsync();
    }

    [HttpGet("{id}")]
    [RequirePermission("Read", nameof(Category))]
    public async Task<ActionResult<Category>> GetCategory(int id)
    {
        var category = await context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound();
        }

        return category;
    }

    [HttpPut("{id}")]
    [RequirePermission("Create", nameof(Category))]
    public async Task<IActionResult> PutCategory(int id, Category category)
    {
        if (id != category.Id)
        {
            return BadRequest();
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        context.Entry(category).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!CategoryExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    [HttpPost]
    [RequirePermission("Post", nameof(Category))]
    public async Task<ActionResult<Category>> PostCategory(Category category)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        context.Categories.Add(category);
        await context.SaveChangesAsync();

        return CreatedAtAction("GetCategory", new { id = category.Id }, category);
    }

    [HttpDelete("{id}")]
    [RequirePermission("Delete", nameof(Category))]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await context.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound();
        }

        var hasProducts = await context.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
        {
            return BadRequest("Cannot delete category that contains products.");
        }

        context.Categories.Remove(category);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private bool CategoryExists(int id)
    {
        return context.Categories.Any(e => e.Id == id);
    }
}