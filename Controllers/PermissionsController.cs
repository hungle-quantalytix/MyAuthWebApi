using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAuthWebApi.Data;
using Microsoft.EntityFrameworkCore;
using MyAuthWebApi.Models;

namespace MyAuthWebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PermissionsController(ApplicationDbContext context)
        {
            _context = context;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<Permission>>> GetPermissions()
        {
            var permissions = await _context.Permissions.ToListAsync();
            return Ok(permissions);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Permission>> GetPermission(int id)
        {
            var permission = await _context.Permissions.FindAsync(id);
            if (permission == null)
            {
                return NotFound();
            }
            return Ok(permission);
        }

        [HttpPost]
        public async Task<ActionResult<Permission>> CreatePermission([FromBody] Permission permission)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            await _context.Permissions.AddAsync(permission);
            _context.SaveChanges();
            return CreatedAtAction(nameof(GetPermission), new { id = permission.Id }, permission);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePermission(int id, [FromBody] Permission permission)
        {
            if (id != permission.Id)
            {
                return BadRequest();
            }

            var existingPermission = await _context.Permissions.FindAsync(id);
            if (existingPermission == null)
            {
                return NotFound();
            }

            existingPermission.ResourceType = permission.ResourceType;
            existingPermission.ResourceId = permission.ResourceId;
            existingPermission.Action = permission.Action;
            existingPermission.SubjectType = permission.SubjectType;
            existingPermission.SubjectId = permission.SubjectId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePermission(int id)
        {
            var permission = await _context.Permissions.FindAsync(id);
            if (permission == null)
            {
                return NotFound();
            }
            _context.Permissions.Remove(permission);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
