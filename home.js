async function fetchHtmlAsText(url) {
  return await (await fetch(url)).text();
}

async function importPage(target) {
  document.querySelector("#" + target).innerHTML = await fetchHtmlAsText(
    target + ".html"
  );
}
importPage("header");
importPage("footer");
importPage("sidenav");
