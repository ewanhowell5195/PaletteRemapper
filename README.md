# Palette Remapper

Remap a source texture's palette using another texture set as lookup references.

---

## How It Works

* `source.png` → The base texture to be recolored.
* `map_from.png` → Defines the pixels to sample colors from in each donor texture.
* `map_to.png` → Defines the positions in the source texture to look up base colors.
* `input/` → Contains donor textures. For each donor, the script generates a recolored version of `source.png`.
* `output/` → Contains the recolored textures, one for each donor.

Process per donor:

1. For each unique color in `map_from.png`, sample the donor texture at that position.
2. Find the same key color in `map_to.png`.

   * The pixel in `source.png` at that position is treated as the "base color".
3. Replace **all pixels in `source.png`** that match the base color with the donor's sampled color.
4. Save the result in `output/` with the same filename as the donor.

---

## Setup

You need [Node.js](https://nodejs.org/) installed.
Run the following command once to set up dependencies:

```bash
npm i
```

---

## Usage

1. Place `source.png`, `map_from.png`, and `map_to.png` in the root folder (next to `index.js`).
2. Put all donor textures into the `input/` folder.
3. Run the script with Node.js:

```bash
node index.js
```

Recolored textures will appear in the `output/` folder, one for each donor in the `input/` folder.

---

## Notes

Sample textures are included in the project if you want to see an example setup or don’t fully understand how to prepare your own files.
