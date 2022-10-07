printLinks = document.getElementById("printLinks");

printLinks.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: printURLs,
  });
});

function printURLs() {
  let pages, products;

  function addFromFristPage() {
    function f(resolve) {
      pages = [
        ...document.querySelectorAll(
          "#paging_setting_bottom a.pagination__link"
        ),
      ];

      products = [...document.getElementsByClassName("product")].map(
        (e) => e.dataset.product_id
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
      await new Promise((resolve2, reject) => {
        nextPage.window.addEventListener("load", () => {
          for (let id of [
            ...nextPage.window.document.getElementsByClassName("product"),
          ]) {
            products.push(id.dataset.product_id);
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
      textarea = "<textarea>" + products.map((e) => e) + "</textarea>";
      tables.document.write(textarea);

      return resolve();
    }
    return new Promise((resolve) => {
      f(resolve);
    });
  }

  async function asyncGetIds() {
    const f1 = await addFromFristPage();
    const f2 = await addFromAllPages();
    const f3 = await printIds();

    return f1, f2, f3;
  }

  asyncGetIds();
}
