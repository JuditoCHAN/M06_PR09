import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();
const fileTreePath = path.join("./uploads/fileTree.json");

const readFileTree = () => {
  try {
    const rawData = fs.readFileSync(fileTreePath, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error al leer el archivo de árbol de directorios", error);
    throw new Error("No se pudo leer el árbol de directorios.");
  }
};

const writeFileTree = (tree: Record<string, any>) => {
  try {
    fs.writeFileSync(fileTreePath, JSON.stringify(tree, null, 2), "utf8");
  } catch (error) {
    console.error("Error al escribir el archivo de árbol de directorios", error);
    throw new Error("No se pudo guardar el árbol de directorios.");
  }
};

// Obtener el árbol de directorios
router.get("/tree", (req, res) => {
  console.log("[dashboard] Solicitud a /tree");

  const fileTree = readFileTree();
  try {
    const requestedPath = req.query.path ? decodeURIComponent(req.query.path as string) : "/";
    const normalizedPath = requestedPath.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
    const directory = fileTree[normalizedPath];

    if (directory) {
      return res.json(directory);
    } else {
      return res.status(404).json({ error: "Directorio no encontrado" });
    }
  } catch (error) {
    console.error("Error en la solicitud a /tree", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear una nueva carpeta
router.post("/directory", (req, res) => {
  console.log("[dashboard] Solicitud a /directory");

  const { path, name } = req.body;
  const fileTree = readFileTree();
  const normalizedPath = path === "/" ? "/" : `${path}/`;
  const newDirPath = `${normalizedPath}${name}`;

  fileTree.id = (fileTree.id || 0) + 1;
  fileTree[newDirPath] = { files: [] };

  fileTree[path].files.push({
    id: newDirPath,
    name: name,
    isDir: true,
    subId: fileTree.id,
  });

  writeFileTree(fileTree);

  res.json({ success: true });
});

// Eliminar un directorio o archivo
router.delete("", async (req, res) => {
  console.log("[dashboard] delete");

  const deleteSubId = req.query.subId;
  const fileTree = readFileTree();

  all: for (const nombresRutas of Object.keys(fileTree)) {
    if (nombresRutas !== "id") {
      for (let index = 0; index < fileTree[nombresRutas].files.length; index++) {
        const element = fileTree[nombresRutas].files[index];
        console.log(deleteSubId)
        console.log(element.subId)

        if (element.subId == deleteSubId) {
          if (element.isDir) {
            delete fileTree[element.id];
          }
          fileTree[nombresRutas].files.splice(index, 1);
          console.log("eliminado")
          break all;
        }
      }
    }
  }

  writeFileTree(fileTree);

  res.json({
    success: true,
  });
});



export default router;
