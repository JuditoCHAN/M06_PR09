import express from "express";

const router = express.Router();
import path from "path";
import fs from "fs";

const fileTreePath = path.join("./uploads/fileTree.json");
console.log(fileTreePath);

function readFileTree() {
  const rawData = fs.readFileSync(fileTreePath, "utf8");
  return JSON.parse(rawData);
}

function writeFileTree(tree: unknown) {
    fs.writeFileSync(fileTreePath, JSON.stringify(tree, null, 2), "utf8");
}
  

// Para obtener el arbol de los directorios
router.get("/tree", (req, res) => {
    console.log("[dashboard] /tree")

  const fileTree = readFileTree();
  try {
    const path = req.query.path
      ? decodeURIComponent(req.query.path as string)
      : "/";

    // Normalizar la ruta (eliminar dobles barras, etc.)
    const normalizedPath = path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
    const directory = fileTree[normalizedPath as keyof typeof fileTree];
    if (directory) {
      res.json(directory);
    } else {
      res.status(404).json({ error: "Directorio no encontrado" });
    }
  } catch (error) {
    console.error("Error en /tree:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Para crear una nueva carpeta
router.post("/directory", async (req, res) => {
    console.log("[dashboard] /directory")

    const { path: path, name } = req.body;
    const fileTree = readFileTree();
    const subDir = path == "/" ? "/": path+"/";
    console.log(subDir);
    fileTree[subDir+name] = {files: []};
    fileTree[path].files.push({
        id: subDir+name,
        name: name,
        isDir: true
    });
    
    writeFileTree(fileTree);

    res.json({
      success: true,
    });

});

export default router;
