const { Builder, By, Key } = require("selenium-webdriver");
const fs = require("fs");
const path = require("path");

(async function main() {
  const driver = await initializeWebDriver("chrome");
  const captureDir = setupDirectory("capturas");
  const reportFile = initializeReportFile("reporte.html");

  try {
    await testSuite(driver, captureDir, reportFile);
  } catch (error) {
    console.error("Error durante la ejecución:", error);
    await handleTestError(driver, captureDir, reportFile, error);
  } finally {
    finalizeReport(reportFile);
    await driver.quit();
    console.log("Reporte generado en:", reportFile);
  }
})();

async function testSuite(driver, captureDir, reportFile) {
  await navigateToHome(driver, captureDir, reportFile);
  await selectFirstQuestion(driver, captureDir, reportFile);
  await searchTags(driver, captureDir, reportFile);
  await validateLoginOnAskPage(driver, captureDir, reportFile);
  await searchAndClickCompany(driver, captureDir, reportFile);
}

// === Utilidades principales ===
async function initializeWebDriver(browser) {
  const driver = await new Builder().forBrowser(browser).build();
  await driver.manage().window().maximize();
  return driver;
}

function setupDirectory(dirName) {
  const dirPath = path.join(__dirname, dirName);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
  return dirPath;
}

function initializeReportFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(filePath, generateReportHeader());
  return filePath;
}

function generateReportHeader() {
  return `
    <html>
    <head>
      <title>Reporte de Pruebas</title>
      <link rel="stylesheet" href="styles.css">
    </head>
    <body>
      <h1>Reporte de Pruebas Automatizadas</h1>
      <table>
        <thead>
          <tr>
            <th>Escenario</th>
            <th>Resultado</th>
            <th>Captura</th>
          </tr>
        </thead>
        <tbody>
  `;
}

function finalizeReport(reportFile) {
  fs.appendFileSync(
    reportFile,
    `
        </tbody>
      </table>
    </body>
    </html>
    `
  );
}

async function saveScreenshot(driver, dir, filename) {
  const screenshot = await driver.takeScreenshot();
  const filePath = path.join(dir, `${filename}.png`);
  fs.writeFileSync(filePath, screenshot, "base64");
  console.log(`Captura guardada en: ${filePath}`);
}

function addToReport(reportFile, testName, result, screenshot) {
  const statusClass = result === "Completada" ? "success" : "failure";
  const screenshotPath = path.join("capturas", screenshot);
  fs.appendFileSync(
    reportFile,
    `
    <tr>
      <td>${testName}</td>
      <td class="${statusClass}">${result}</td>
      <td><a href="${screenshotPath}" target="_blank">Ver</a></td>
    </tr>
    `
  );
}

// === Rediseño de procesos ===
async function navigateToHome(driver, captureDir, reportFile) {
  await driver.get("https://stackoverflow.com");
  await driver.sleep(5000);
  await saveScreenshot(driver, captureDir, "inicio_stack");
  addToReport(
    reportFile,
    "Inicio de StackOverflow",
    "Completada",
    "inicio_stack.png"
  );
}

async function selectFirstQuestion(driver, captureDir, reportFile) {
  try {
    await driver.get("https://stackoverflow.com/questions");
    await driver.sleep(5000);

    const firstQuestion = await driver.findElement(
      By.css(".s-post-summary .s-link")
    );
    const questionText = await firstQuestion.getText();
    await firstQuestion.click();
    await driver.sleep(5000);

    await saveScreenshot(driver, captureDir, "primera_pregunta");
    addToReport(
      reportFile,
      `Seleccionar primera pregunta`,
      "Completada",
      "primera_pregunta.png"
    );
  } catch (error) {
    await handleTestError(driver, captureDir, reportFile, error);
  }
}

async function searchTags(driver, captureDir, reportFile) {
  try {
    await driver.get("https://stackoverflow.com/tags");
    const searchText = "Javascript";
    const searchBox = await driver.findElement(
      By.css('input[placeholder="Filter by tag name"]')
    );
    await searchBox.sendKeys(searchText);
    await driver.sleep(2000);

    await saveScreenshot(driver, captureDir, "busqueda_tags");
    addToReport(
      reportFile,
      `Búsqueda de tags: ${searchText}`,
      "Completada",
      "busqueda_tags.png"
    );
  } catch (error) {
    await handleTestError(driver, captureDir, reportFile, error);
  }
}

async function validateLoginOnAskPage(driver, captureDir, reportFile) {
  try {
    await driver.get("https://stackoverflow.com/questions/ask");
    await saveScreenshot(driver, captureDir, "login_pregunta");
    addToReport(
      reportFile,
      "Validación de login en Preguntar",
      "Completada",
      "login_pregunta.png"
    );
  } catch (error) {
    await handleTestError(driver, captureDir, reportFile, error);
  }
}

async function searchAndClickCompany(driver, captureDir, reportFile) {
  try {
    await driver.get("https://stackoverflow.com/jobs/companies");
    const searchInput = await driver.findElement(
      By.css('input[placeholder="Search all companies"]')
    );
    await searchInput.sendKeys("Contentful", Key.RETURN);
    await driver.sleep(5000);

    await saveScreenshot(driver, captureDir, "search_companies");
    addToReport(
      reportFile,
      "Buscar y seleccionar compañía",
      "Completada",
      "search_companies.png"
    );
  } catch (error) {
    await handleTestError(driver, captureDir, reportFile, error);
  }
}

async function handleTestError(driver, captureDir, reportFile, error) {
  console.error("Error capturado:", error);
  await saveScreenshot(driver, captureDir, "test_error");
  addToReport(
    reportFile,
    "Error durante la ejecución",
    "Fallo",
    "test_error.png"
  );
}
