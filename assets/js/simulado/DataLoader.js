// Carregamento de dados JSON
export class DataLoader {
  async loadAllData() {
    const [positions, meta] = await Promise.all([
      this.loadPositions(),
      this.loadMeta(),
    ]);

    return { positions, meta };
  }

  async loadPositions() {
    console.log("Carregando positions.json...");
    const response = await fetch("positions.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log("Positions carregado, tamanho:", text.length);

    const data = JSON.parse(text);
    console.log(
      "Positions parseado com sucesso. Anos disponíveis:",
      Object.keys(data)
    );

    return data;
  }

  async loadMeta() {
    console.log("Carregando meta.json...");
    const response = await fetch("meta.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log("Meta carregado, tamanho:", text.length);

    const data = JSON.parse(text);
    console.log(
      "Meta parseado com sucesso. Anos disponíveis no meta:",
      Object.keys(data)
    );

    return data;
  }
}
