const form = document.getElementById("form");
const input1 = document.getElementById("parameter");
const input2 = document.getElementById("dataSetParameter");
const input3 = document.getElementById("pagination");

let parameters = {
  selector: "",
  dataSet: "",
  pagination: "",
};

input1.addEventListener("input", (e) => (parameters.selector = e.target.value));

input2.addEventListener("input", (e) => (parameters.dataSet = e.target.value));

input3.addEventListener(
  "input",
  (e) => (parameters.pagination = e.target.value)
);

document.getElementById("default").addEventListener("click", (e) => {
  if (e.target.checked === true) {
    input1.value = ".product";
    parameters.selector = ".product";
    input2.value = "data-product_id";
    parameters.dataSet = "data-product_id";
    input3.value = "#paging_setting_bottom a.pagination__link";
    parameters.pagination = "#paging_setting_bottom a.pagination__link";
  } else {
    input1.value = "";
    parameters.selector = "";
    input2.value = "";
    parameters.dataSet = "";
    input3.value = "";
    parameters.pagination = "";
  }
});

form.addEventListener("submit", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const arg = parameters;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: printURLs,
    // func: handleForm,
    args: [arg],
  });
});

function printURLs(args) {
  const parameters = args;
  let pages, products;

  function addFromFristPage() {
    function f(resolve) {
      pages = parameters.pagination
        ? [...document.querySelectorAll(parameters.pagination)]
        : null;

      products = [...document.querySelectorAll(parameters.selector)].map((e) =>
        parameters.dataSet ? e.getAttribute(parameters.dataSet) : e.innerText
      );

      return resolve();
    }

    return new Promise((resolve) => {
      f(resolve);
    });
  }

  function addFromAllPages() {
    let nextPage;
    async function getIdsFromNextPage() {
      await new Promise((resolve2) => {
        nextPage.window.addEventListener("load", () => {
          for (let id of [
            ...nextPage.window.document.querySelectorAll(parameters.selector),
          ]) {
            products.push(
              parameters.dataSet
                ? id.getAttribute(parameters.dataSet)
                : id.innerText
            );
          }
          nextPage.close();
          return resolve2();
        });
      });
    }

    async function f(resolve) {
      for (let page of pages) {
        nextPage = window.open(page.href);

        await getIdsFromNextPage();
      }
      return resolve();
    }

    return new Promise((resolve) => {
      f(resolve);
    });
  }

  function printIds() {
    function f(resolve) {
      let textarea;
      const tables = window.open("", "Kategorie - linki");
      tables.document.write(`<style>
  textarea {
    width: 500px;
    height: 500px;
  }
  </style>`);

      textarea =
        "<textarea>" + products.map((e) => e + "\n").join("") + "</textarea>";
      tables.document.write(textarea);

      return resolve();
    }
    return new Promise((resolve) => {
      f(resolve);
    });
  }

  async function asyncGetIds() {
    const f1 = await addFromFristPage();
    const f2 = pages ? await addFromAllPages() : null;
    const f3 = await printIds();

    if (!parameters.selector) {
      return console.error("brak podanych parametrów");
    } else {
      return f1, f2, f3;
    }
  }

  asyncGetIds();
}
