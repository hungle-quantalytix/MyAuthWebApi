# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ASP.NET Core Web API project (`MyAuthWebApi`) targeting .NET 10.0 preview. It's a standard Web API template project with minimal authentication setup, featuring:
- ASP.NET Core Web API with controllers
- OpenAPI/Swagger integration for development
- Single WeatherForecast controller for demonstration

## Development Commands

### Running the Application
```bash
dotnet run
```
The application will start on:
- HTTP: http://localhost:5245
- HTTPS: https://localhost:7062

### Building the Project
```bash
dotnet build
```

### Restoring Dependencies
```bash
dotnet restore
```

### Development with Hot Reload
```bash
dotnet watch run
```

## Project Structure

- `Program.cs` - Application entry point and service configuration
- `Controllers/` - Web API controllers
  - `WeatherForecastController.cs` - Sample controller demonstrating API patterns
- `WeatherForecast.cs` - Data model classes
- `MyAuthWebApi.http` - HTTP request examples for testing endpoints
- `Properties/launchSettings.json` - Launch configuration for development profiles
- `appsettings.json` / `appsettings.Development.json` - Application configuration

## Architecture Notes

- Uses .NET 10.0 preview with nullable reference types enabled
- Standard ASP.NET Core Web API architecture with controller-based routing
- OpenAPI integration enabled in development environment only
- Controllers use attribute routing (`[Route("[controller]")]`)
- Currently configured for development without authentication enforcement

## Testing Endpoints

Use the provided `MyAuthWebApi.http` file to test API endpoints:
- Base URL: http://localhost:5245
- WeatherForecast endpoint: GET /weatherforecast

## Configuration

- Development launch settings configured for both HTTP and HTTPS profiles
- Environment-specific configuration via `appsettings.{Environment}.json`
- No special authentication or authorization configured yet (despite project name suggesting auth features)