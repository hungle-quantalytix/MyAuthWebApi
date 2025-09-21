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
public class ProductsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    //[RequirePermission"Read", nameof(Product))]
    [RequireClaim("read", nameof(Product))]
    public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
    {
        return await context.Products.Include(x => x.Category).ToListAsync();
    }

    [HttpGet("{id}")]
    //[RequirePermission"Read", nameof(Product))]
    [RequireClaim("read", nameof(Product))]
    public async Task<ActionResult<Product>> GetProduct(int id)
    {
        var product = await context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return NotFound();
        }

        return product;
    }

    [HttpPut("{id}")]
    //[RequirePermission"Update", nameof(Product))]
    [RequireClaim("write", nameof(Product))]
    public async Task<IActionResult> PutProduct(int id, Product product)
    {
        if (id != product.Id)
        {
            return BadRequest();
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        context.Entry(product).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ProductExists(id))
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
    //[RequirePermission"Create", nameof(Product))]
    [RequireClaim("write", nameof(Product))]
    public async Task<ActionResult<Product>> PostProduct(Product product)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        context.Products.Add(product);
        await context.SaveChangesAsync();

        return CreatedAtAction("GetProduct", new { id = product.Id }, product);
    }

    [HttpDelete("{id}")]
    //[RequirePermission"Delete", nameof(Product))]
    [RequireClaim("write", nameof(Product))]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        context.Products.Remove(product);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private bool ProductExists(int id)
    {
        return context.Products.Any(e => e.Id == id);
    }
}