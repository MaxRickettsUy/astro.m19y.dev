const desiredRepo = "MaxRicketts-Uy";
const dateTagClass = ".date";

const headers = ["Week", "Stocks", "Total Invested", "Dividends"];

const generateDivHarvestingTable = () => {

  const createElement = (element) => {
    return document.createElement(element);
  }

  const divHarvestingDiv = document.getElementById("dividend-harvesting");
  const table = createElement("table");
  const headerRow = createElement("tr");
  const tBody = createElement("tbody");

  if(table !== null && divHarvestingDiv !== null){
    headers.forEach((h) => {
      let header = createElement("th");
      header.innerHTML = h;
      headerRow.appendChild(header);
    })

    table.appendChild(headerRow);

    data.forEach((d) => {
      const weekRow = createElement("tr");
      const weekCell = createElement("td");
      const stockCell = createElement("td");
      const investedCell = createElement("td");
      const divCell = createElement("td");

      const weekA = createElement("a");

      weekCell.innerHTML = d.week;
      stockCell.innerHTML = d.stocks;
      investedCell.innerHTML = "$" + d.week * 100;
      divCell.innerHTML = "";

      weekRow.appendChild(weekCell);
      weekRow.appendChild(stockCell);
      weekRow.appendChild(investedCell);
      weekRow.appendChild(divCell);

      tBody.appendChild(weekRow);
    })

    table.appendChild(tBody);

    divHarvestingDiv.appendChild(table);
  }
}

window.addEventListener('load', function () {
    generateDivHarvestingTable();
})

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function()
{
  if (this.readyState == 4 && this.status == 200)
  {
    let repos = JSON.parse(this.responseText);

    repos.forEach((repo)=>{
      if (repo.name == desiredRepo)
      {
        var lastUpdated = new Date(repo.updated_at);
        var day = lastUpdated.getUTCDate() - 1;

        var month = lastUpdated.getUTCMonth() + 1;

        var year = lastUpdated.getUTCFullYear();
        document.querySelector(dateTagClass).innerText = `Last updated: ${month}/${day}/${year}`;
      }
    });
  }
};
xhttp.open("GET", "https://api.github.com/users/MaxRickettsUy/repos", true);
xhttp.send();