import { Builder, By, until } from "selenium-webdriver";

(async () => {
  const driver = new Builder().forBrowser("chrome").build();

  try {
    // Step 1: Navigate to the login page
    await driver.get("http://localhost:3000");

    // Step 2: Perform login
    const usernameField = await driver.wait(
      until.elementLocated(By.css("input[placeholder='username']")),
      10000
    );
    await usernameField.sendKeys("ece30861defaultadminuser");

    const passwordField = await driver.findElement(By.css("input[placeholder='password']"));
    await passwordField.sendKeys("correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;");

    const adminCheckbox = await driver.findElement(By.css("input[type='checkbox']"));
    const isAdminChecked = await adminCheckbox.isSelected();
    if (!isAdminChecked) {
      await adminCheckbox.click();
    }

    const loginButton = await driver.findElement(By.css("button[type='submit']"));
    await loginButton.click();

    // Step 3: Wait for login to complete and redirection to occur
    await driver.wait(until.urlIs("http://localhost:3000/search"), 10000); // Adjust URL as needed

    // Step 4: Navigate to the UpdatePage
    await driver.get("http://localhost:3000/upload");

    // Step 5: Perform the update test as before
    const nameField = await driver.wait(
      until.elementLocated(By.css("input[placeholder='Name']")),
      10000
    );
    await nameField.sendKeys("ExamplePackage");

    const versionField = await driver.findElement(By.css("input[placeholder='Version']"));
    await versionField.sendKeys("1.0.0");

    const updateButton = await driver.findElement(By.css("button"));
    await updateButton.click();

    console.log("login test passed!");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await driver.quit();
  }
})();
