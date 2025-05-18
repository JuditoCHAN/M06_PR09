// dashboard.ts
// Rutas para la gestión de archivos y carpetas (dashboard tipo explorador)
//
// Endpoints principales:
//   - GET /tree: Devuelve el árbol de directorios y archivos
//   - POST /directory: Crea un nuevo directorio
//   - POST /rename: Renombra un directorio
//   - POST /edit: Edita los metadatos de un directorio
//   - DELETE /: Elimina un archivo o directorio
//
// Funcionalidad principal:
//   - Lee y escribe el árbol de archivos en uploads/fileTree.json
//   - Permite crear, renombrar, eliminar y editar carpetas y archivos

import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { ParsedQs } from "qs";


// Definición de tipos para multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Definición de tipos para el árbol de archivos
interface FileTreeItem {
  id: string;
  name: string;
  isDir: boolean;
  subId: number;
  size?: number;
  fileId?: string;
}

interface DirectoryContent {
  files: FileTreeItem[];
  metadata?: string;
}

interface FileTree {
  id: number;
  [key: string]: DirectoryContent | number;
}

const router = express.Router();
const fileTreePath = path.join("./uploads/fileTree.json");
const uploadsDir = path.join("./uploads");

// Configuración de multer para almacenar archivos
const storage = multer.diskStorage({
  destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    // Asegurarse de que el directorio uploads existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // Incrementar el ID global
    const fileTree = readFileTree();
    fileTree.id = (fileTree.id || 0) + 1;
    const subId = fileTree.id;
    
    // Usar subId como nombre del archivo
    writeFileTree(fileTree);
    
    cb(null, `${subId}.txt`);
  }
});

// Filtro para permitir solo archivos txt y json
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Verificar la extensión del archivo
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.txt' || ext === '.json') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos .txt y .json'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

const readFileTree = (): FileTree => {
  try {
    // Crear el archivo fileTree.json si no existe
    if (!fs.existsSync(fileTreePath)) {
      const initialTree: FileTree = {
        id: 0,
        "/": { files: [] }
      };
      fs.writeFileSync(fileTreePath, JSON.stringify(initialTree, null, 2), "utf8");
      return initialTree;
    }
    
    const rawData = fs.readFileSync(fileTreePath, "utf8");
    return JSON.parse(rawData) as FileTree;
  } catch (error) {
    console.error("Error al leer el archivo de árbol de directorios", error);
    throw new Error("No se pudo leer el árbol de directorios.");
  }
};

const writeFileTree = (tree: FileTree): void => {
  try {
    // Asegurarse de que el directorio uploads existe
    if (!fs.existsSync(path.dirname(fileTreePath))) {
      fs.mkdirSync(path.dirname(fileTreePath), { recursive: true });
    }
    fs.writeFileSync(fileTreePath, JSON.stringify(tree, null, 2), "utf8");
  } catch (error) {
    console.error("Error al escribir el archivo de árbol de directorios", error);
    throw new Error("No se pudo guardar el árbol de directorios.");
  }
};

// Obtener el árbol de directorios
router.get("/tree", (req: Request, res: Response) => {
  console.log("[dashboard] Solicitud a /tree");

  const fileTree = readFileTree();
  try {
    const requestedPath = req.query.path ? String(req.query.path) : "/";
    const normalizedPath = requestedPath.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
    const directory = fileTree[normalizedPath] as DirectoryContent;

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
router.post("/directory", (req: Request, res: Response) => {
  console.log("[dashboard] Solicitud a /directory");

  const { path: dirPath, name } = req.body;
  const fileTree = readFileTree();
  const normalizedPath = dirPath === "/" ? "/" : `${dirPath}/`;
  const newDirPath = `${normalizedPath}${name}`;

  // Incrementar el ID global
  fileTree.id = (fileTree.id || 0) + 1;
  const newSubId = fileTree.id;
  
  fileTree[newDirPath] = { files: [] };

  (fileTree[dirPath] as DirectoryContent).files.push({
    id: newDirPath,
    name: name,
    isDir: true,
    subId: newSubId,
  });

  writeFileTree(fileTree);

  res.json({ 
    success: true,
    directory: {
      id: newDirPath,
      name: name,
      subId: newSubId
    }
  });
});

// Subir archivo - using Express.Multer.File interface
router.post("/upload", upload.single("file"), (req: Request & { file?: Express.Multer.File }, res: Response) => {
  console.log("[dashboard] Solicitud a /upload");
  
  if (!req.file || !req.body.path) {
    return res.status(400).json({ error: "Archivo o ruta no especificados" });
  }

  // Verificar si es un archivo permitido
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.txt' && ext !== '.json') {
    return res.status(400).json({ error: "Solo se permiten archivos .txt y .json" });
  }

  try {
    const fileTree = readFileTree();
    const uploadPath = req.body.path;
    
    // Usar subId como identificador del archivo
    const subId = Number(path.basename(req.file.filename, ".txt"));
    const fileName = req.file.originalname;

    // Verificar que el directorio de destino existe
    if (!fileTree[uploadPath]) {
      return res.status(404).json({ error: "Directorio de destino no encontrado" });
    }

    // Crear la entrada del archivo en el árbol
    const filePath = `${uploadPath}/${fileName}`.replace(/\/\//g, '/');
    (fileTree[uploadPath] as DirectoryContent).files.push({
      id: filePath,
      name: fileName,
      isDir: false,
      size: req.file.size || 0,
      subId: subId,
      fileId: subId.toString()
    });

    writeFileTree(fileTree);

    res.json({ 
      success: true, 
      file: {
        id: filePath,
        name: fileName,
        subId: subId,
        fileId: subId.toString(),
        size: req.file.size || 0
      }
    });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/rename", (req: Request, res: Response) => {
  console.log("[dashboard] Solicitud a /rename");

  const { oldPath, newName } = req.body; 
  const fileTree = readFileTree();
  
  const folderToRename = fileTree[oldPath] as DirectoryContent;
  if (!folderToRename) {
    return res.status(404).json({ error: "Folder not found" });
  }

  const parentPath = path.dirname(oldPath) === "." ? "/" : path.dirname(oldPath);
  const newFolderPath = (parentPath === "/" ? `/${newName}` : `${parentPath}/${newName}`);

  fileTree[newFolderPath] = fileTree[oldPath];
  delete fileTree[oldPath];

  const parentDir = fileTree[parentPath] as DirectoryContent;
  if (parentDir) {
    parentDir.files = parentDir.files.map((file: FileTreeItem) =>
      file.id === oldPath ? { ...file, id: newFolderPath, name: newName } : file
    );
  }

  writeFileTree(fileTree);

  res.json({ success: true });
});
// Edit a folder's metadata
router.post("/edit", (req: Request, res: Response) => {
  console.log("[dashboard] Solicitud a /edit");

  const { path: folderPath, metadata } = req.body; 
  const fileTree = readFileTree();
  
  const folder = fileTree[folderPath] as DirectoryContent;
  if (!folder) {
    return res.status(404).json({ error: "Folder not found" });
  }

  folder.metadata = metadata;

  writeFileTree(fileTree);

  res.json({ success: true });
});

// Eliminar un directorio o archivo
router.delete("", async (req: Request, res: Response) => {
  console.log("[dashboard] delete");

  const deleteSubId = req.query.subId;
  const fileTree = readFileTree();
  let fileIdToDelete: string | null = null;
  let removedItem: FileTreeItem | null = null;

  all: for (const pathKey of Object.keys(fileTree)) {
    if (pathKey !== "id") {
      const dirContent = fileTree[pathKey] as DirectoryContent;
      for (let index = 0; index < dirContent.files.length; index++) {
        const element = dirContent.files[index];
        if (element.subId == Number(deleteSubId)) {
          removedItem = { ...element };
          
          if (element.isDir) {
            delete fileTree[element.id];
          } else if (element.fileId) {
            // Si es un archivo, guarda su fileId para eliminarlo físicamente
            fileIdToDelete = element.fileId;
          }
          
          dirContent.files.splice(index, 1);
          break all;
        }
      }
    }
  }

  // Si hay un archivo para eliminar físicamente
  if (fileIdToDelete) {
    const filePath = path.join(uploadsDir, `${fileIdToDelete}.txt`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[dashboard] Archivo eliminado físicamente: ${filePath}`);
      } catch (error) {
        console.error(`[dashboard] Error al eliminar archivo físico: ${filePath}`, error);
      }
    }
  }

  writeFileTree(fileTree);

  res.json({
    success: true,
    removed: removedItem
  });
});

export default router;