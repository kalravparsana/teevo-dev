# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login/login.form.spec.ts >> Login — Form Tests >> valid demo email signs in successfully
- Location: automation-tests/login/login.form.spec.ts:25:3

# Error details

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Please install them with the following command:      ║
║                                                      ║
║     npx playwright install-deps                      ║
║                                                      ║
║ Alternatively, use apt:                              ║
║     apt-get install libglib2.0-0\                    ║
║         libnspr4\                                    ║
║         libnss3\                                     ║
║         libatk1.0-0\                                 ║
║         libdbus-1-3\                                 ║
║         libx11-6\                                    ║
║         libxcomposite1\                              ║
║         libxdamage1\                                 ║
║         libxext6\                                    ║
║         libxfixes3\                                  ║
║         libxrandr2\                                  ║
║         libgbm1\                                     ║
║         libxcb1\                                     ║
║         libxkbcommon0\                               ║
║         libasound2\                                  ║
║         libatspi2.0-0                                ║
║                                                      ║
║ <3 Playwright Team                                   ║
╚══════════════════════════════════════════════════════╝
```