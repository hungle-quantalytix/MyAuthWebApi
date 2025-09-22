using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyAuthWebApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdditionalRules",
                table: "Navigations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderPath",
                table: "Navigations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Navigations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdditionalRules",
                table: "Navigations");

            migrationBuilder.DropColumn(
                name: "OrderPath",
                table: "Navigations");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Navigations");
        }
    }
}
