const places = [
  "1-1","1-2","1-3","1-4","1-5","1-6","1-7",
  "2-1","2-2","2-3","2-4","2-5","2-6","2-7","2-8","2-9","2-10","2-11",
  "3-1","3-2","3-3","3-4","3-5","3-6","3-7","3-8","3-9","3-10","3-11","3-12","3-13",
  "4-1","4-2","4-3",
  "5-1","5-2","5-3","5-4","5-5","5-6","5-7",
  "6-1","6-2","6-3","6-4","6-5","6-6","6-7",
  "7-1","7-2","7-3","7-4","7-5","7-6","7-7",
  "洗車1","洗車2","洗車3",
  "回送1","回送2","回送3",
  "車検1","車検2",
  "納車待ち",
  "出庫口",
  "入庫口"
];

const layout = {};

places.forEach((p, i) => {
  let x = 0;
  let y = 0;

  if (p.startsWith("1-")) {
    x = 520 + Number(p.split("-")[1]) * 85;
    y = 560;
  } else if (p.startsWith("2-")) {
    x = 520 + Number(p.split("-")[1]) * 85;
    y = 460;
  } else if (p.startsWith("3-")) {
    x = 520 + Number(p.split("-")[1]) * 85;
    y = 320;
  } else if (p.startsWith("4-")) {
    x = 520 + Number(p.split("-")[1]) * 85;
    y = 220;
  } else if (p.startsWith("5-")) {
    x = 350;
    y = 120 + Number(p.split("-")[1]) * 65;
  } else if (p.startsWith("6-")) {
    x = 260;
    y = 120 + Number(p.split("-")[1]) * 65;
  } else if (p.startsWith("7-")) {
    x = 170;
    y = 120 + Number(p.split("-")[1]) * 65;
  } else if (p.startsWith("洗車")) {
    x = 620 + (Number(p.replace("洗車", "")) - 1) * 90;
    y = 650;
  } else if (p.startsWith("回送")) {
    x = 620 + (Number(p.replace("回送", "")) - 1) * 90;
    y = 710;
  } else if (p.startsWith("車検")) {
    x = 900 + (Number(p.replace("車検", "")) - 1) * 90;
    y = 650;
  } else if (p === "納車待ち") {
    x = 1080;
    y = 650;
  } else if (p === "出庫口") {
    x = 1180;
    y = 650;
  } else if (p === "入庫口") {
    x = 1180;
    y = 710;
  }

  layout[p] = { x, y };
});

let cars = JSON.parse(localStorage.getItem("yardCars")) || [];

const yard = document.getElementById("yard");
const placeSelect = document.getElementById("place");

places.forEach(p => {
  const opt = document.createElement("option");
  opt.value = p;
  opt.textContent = p;
  placeSelect.appendChild(opt);
});

function render() {
  yard.innerHTML = `
    <div class="area-title" style="left:40px;top:30px;">整備場</div>
    <div class="area-title" style="left:40px;top:640px;">道路 / 出入口</div>
  `;

  places.forEach(place => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.style.left = layout[place].x + "px";
    slot.style.top = layout[place].y + "px";
    slot.dataset.place = place;

    const car = cars.find(c => c.place === place);

    slot.innerHTML = `
      <div class="slot-label">${place}</div>
      ${
        car
          ? `<div class="car ${statusClass(car.status)}" draggable="true" data-id="${car.id}">
              ${car.company}<br>${car.bodyNo}<br>${car.status}
            </div>`
          : `<div class="empty">空</div>`
      }
    `;

    slot.addEventListener("dragover", e => e.preventDefault());

    slot.addEventListener("drop", e => {
      const id = e.dataTransfer.getData("id");
      moveCar(id, place);
    });

    yard.appendChild(slot);
  });

  document.querySelectorAll(".car").forEach(card => {
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("id", card.dataset.id);
    });

    card.addEventListener("dblclick", () => {
      if (confirm("この車両を削除しますか？")) {
        cars = cars.filter(c => c.id != card.dataset.id);
        save();
        render();
      }
    });
  });
}

function addCar() {
  const status = document.getElementById("status").value;
  const company = document.getElementById("company").value.trim();
  const bodyNo = document.getElementById("bodyNo").value.trim();
  let place = document.getElementById("place").value;

  if (!company || !bodyNo) {
    alert("会社名と車体番号を入力してください");
    return;
  }

  const already = cars.find(c => c.place === place);
  if (already) {
    alert("その場所にはすでに車両があります");
    return;
  }

  cars.push({
    id: Date.now(),
    status,
    company,
    bodyNo,
    place
  });

  document.getElementById("company").value = "";
  document.getElementById("bodyNo").value = "";

  save();
  render();
}

function moveCar(id, newPlace) {
  const target = cars.find(c => c.place === newPlace);

  if (target) {
    alert("移動先に車両があります");
    return;
  }

  const car = cars.find(c => c.id == id);
  if (!car) return;

  car.place = newPlace;

  save();
  render();
}

function statusClass(status) {
  if (status === "洗車") return "wash";
  if (status === "回送") return "transfer";
  if (status === "車検") return "inspection";
  if (status === "納車") return "delivery";
  if (status === "入庫" || status === "出庫") return "inout";
  return "other";
}

function save() {
  localStorage.setItem("yardCars", JSON.stringify(cars));
}

document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();

  document.querySelectorAll(".slot").forEach(s => {
    s.classList.remove("highlight");
  });

  if (!q) return;

  const hit = cars.find(c =>
    c.company.toLowerCase().includes(q) ||
    c.bodyNo.toLowerCase().includes(q)
  );

  if (hit) {
    const slot = document.querySelector(`[data-place="${hit.place}"]`);
    if (slot) {
      slot.classList.add("highlight");
      slot.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }
});

render();