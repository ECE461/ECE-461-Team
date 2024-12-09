import { Builder, By, Key, until, WebDriver } from "selenium-webdriver";

let driver: WebDriver;

const updatePageTest = async () => {
  try {
    // Initialize WebDriver
    driver = await new Builder().forBrowser("chrome").build();

    // Navigate to the UpdatePage
    await driver.get("http://localhost:3000/update"); // Change to your app URL

    // Wait for the page to load
    await driver.wait(until.elementLocated(By.css("input[placeholder='Name']")), 5000);

    // Fill in the Name field
    const nameField = await driver.findElement(By.css("input[placeholder='Name']"));
    await nameField.sendKeys("ExamplePackage");

    // Fill in the Version field
    const versionField = await driver.findElement(By.css("input[placeholder='Version']"));
    await versionField.sendKeys("1.0.0");

    // Select a ZIP file
    const fileInput = await driver.findElement(By.css("input[type='file']"));
    const filePath = "/path/to/your/file.zip"; // Provide the correct file path
    await fileInput.sendKeys(filePath);

    // Enter a new version
    const newVersionField = await driver.findElement(By.css("input[placeholder='Version']"));
    await newVersionField.clear();
    await newVersionField.sendKeys("1.1.0");

    // Check the Debloat checkbox
    const debloatCheckbox = await driver.findElement(By.css("input[type='checkbox']"));
    await debloatCheckbox.click();

    // Click the Update button
    const updateButton = await driver.findElement(By.css("button"));
    await updateButton.click();

    // Wait for the success message
    const successMessage = await driver.wait(
      until.elementLocated(By.xpath("//p[contains(text(), 'Update successful!')]")),
      5000
    );

    console.log(await successMessage.getText());
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Quit the WebDriver
    if (driver) await driver.quit();
  }
};

// Run the test
updatePageTest();
