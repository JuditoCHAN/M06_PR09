import { useState, useEffect, useRef } from "react";
import { setChonkyDefaults } from "@aperturerobotics/chonky";
import { ChonkyIconFA } from "@aperturerobotics/chonky-icon-fontawesome";
import {
  FileBrowser,
  FileNavbar,
  FileToolbar,
  FileList,
  FileContextMenu,
  ChonkyIconName,
  ChonkyActions,
  defineFileAction,
} from "@aperturerobotics/chonky";
import '../css/dashboard.css';

setChonkyDefaults({ iconComponent: ChonkyIconFA });

// FileManager.tsx
// Componente de gestión de archivos y carpetas con interfaz tipo explorador
//
// Props:
//   - setFileSelector: función para seleccionar el archivo a editar
//
// Funcionalidad principal:
//   - Muestra archivos y carpetas usando la librería Chonky
//   - Permite navegar por carpetas, crear, renombrar y eliminar directorios
//   - Permite subir archivos y seleccionar archivos para editar
//   - Sincroniza la estructura de archivos con el backend
//
// Principales funciones internas:
//   - loadFiles: Carga los archivos y carpetas del backend según la ruta actual
//   - handleFileOpen: Navega a una carpeta o selecciona un archivo para editar
//   - handleDelete: Elimina archivos o carpetas
//   - handleCreateDirectory: Crea un nuevo directorio
//   - handleRenameFolder: Renombra un directorio
//   - handleEditFile: Selecciona un archivo para editar
//   - handleFileInputChange: Sube un archivo al backend
//   - handleAction: Gestiona las acciones personalizadas de Chonky
//
// Efectos:
//   - useEffect para cargar archivos al cambiar de carpeta o tras una acción
//
// Renderiza:
//   - Explorador de archivos con acciones personalizadas (crear, renombrar, eliminar, subir, editar)
//   - Input oculto para subir archivos

const FileManager = ({ setFileSelector } ) => {
  const [files, setFiles] = useState([]);
  const [folderChain, setFolderChain] = useState([{ 
    id: "/", 
    name: "home", 
    isDir: true 
  }]);

  const [currentPath, setCurrentPath] = useState("/");
  const [trigger, setTrigger] = useState(0);
  
  // Referencia al input de archivo
  const fileInputRef = useRef(null);

  const reload = () => setTrigger(prev => prev + 1);
  
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/dashboard/tree?path=${encodeURIComponent(currentPath)}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.files) {
          setFiles(data.files.map(file => ({
            ...file,
            id: `${currentPath}/${file.name}`.replace(/\/\//g, '/')
          })));
          
          if (currentPath === "/") {
            setFolderChain([{ id: "/", name: "home", isDir: true }]);
          } else {
            const pathParts = currentPath.split("/").filter(Boolean);
            const chain = pathParts.map((part, index) => ({
              id: `/${pathParts.slice(0, index + 1).join("/")}`,
              name: part,
              isDir: true,
            }));
            setFolderChain([{ id: "/", name: "home", isDir: true }, ...chain]);
          }
        }
      } catch (error) {
        console.error("Error al cargar archivos:", error);
        setCurrentPath("/");
      }
    };

    loadFiles();
  }, [currentPath, trigger]);

  // Manejar cambio de directorio
  const handleFileOpen = (file) => {
    if (file.isDir) {
      setCurrentPath(file.id);
    } else {
      setFileSelector(file.subId);
    }
  };

  const handleDelete = (subId) => {
    fetch(`http://localhost:5001/dashboard?subId=${subId}`, {
      method: "DELETE",
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          reload();
        } else {
          alert("Error al eliminar el archivo");
        }
      })
      .catch(error => {
        console.error("Error al eliminar:", error);
        alert("Error al eliminar el archivo");
      });
  };

  const handleCreateDirectory = async () => {
    const directoryName = prompt("Ingrese el nombre del nuevo directorio:");
    
    if (!directoryName) return;

    try {
      const response = await fetch("http://localhost:5001/dashboard/directory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: currentPath,
          name: directoryName
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Directorio creado: ${directoryName}`);
        reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error al crear directorio:", error);
      alert("Error al crear directorio");
    }
  };

  const handleRenameFolder = async (folderPath) => {
    const newName = prompt("Enter new folder name:");

    if (!newName) return;

    try {
      const response = await fetch("http://localhost:5001/dashboard/rename", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPath: folderPath,
          newName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Folder renamed to: ${newName}`);
        reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error renaming folder:", error);
      alert("Error renaming folder");
    }
  };

  const handleEditFile = async (folderPath) => {

    setFileSelector(folderPath)
  };

  // Input de archivo oculto para la subida
  const triggerFileInput = (folderPath) => {
    // Guardar la ruta de destino como atributo en el input
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-upload-path', folderPath);
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Obtener la ruta de destino del atributo personalizado
    const uploadPath = fileInputRef.current.getAttribute('data-upload-path') || currentPath;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", uploadPath);

    try {
      const response = await fetch("http://localhost:5001/dashboard/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Archivo subido: ${file.name}`);
        reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error al subir archivo:", error);
      alert("Error al subir archivo");
    }

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = null;
  };

  // Acción personalizada para navegar hacia atrás
  const goBack = defineFileAction({
    id: "go_back",
    button: {
      name: "Atrás",
      toolbar: true,
      icon: ChonkyIconName.arrowLeft,
    },
  });

  // Acción para subir archivos
  const uploadFiles = defineFileAction({
    id: "upload_files",
    button: {
      name: "Subir archivo",
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.upload,
    },
  });

  const handleAction = (data) => {
    if (data.id === createNewFolder.id) {
      handleCreateDirectory();
    }

    // Handle Edit Folder action
    if (data.id === editFiles.id) {
      const selectedFile = data.state.selectedFiles[0];
      if (selectedFile && !data.state.selectedFiles[0].isDir) {
        handleEditFile(selectedFile.subId);
      }
    }

    // Handle Rename Folder action
    if (data.id === renameFiles.id) {
      const selectedFile = data.state.selectedFiles[0];
      if (selectedFile) {
        handleRenameFolder(selectedFile.id);
      }
    }

    // Handle custom Upload Files action
    if (data.id === uploadFiles.id) {
      // Si hay un directorio seleccionado, subir al directorio seleccionado
      if (data.state.selectedFiles.length > 0 && data.state.selectedFiles[0].isDir) {
        triggerFileInput(data.state.selectedFiles[0].id);
      } else {
        // Si no hay selección o no es un directorio, subir al directorio actual
        triggerFileInput(currentPath);
      }
    }

    // Handle Delete Files action
    if (data.id === ChonkyActions.DeleteFiles.id) {
      data.state.selectedFiles.forEach((element) => {
        handleDelete(element.subId);
      });
    }

    // Handle file open action
    if (data.id === ChonkyActions.OpenFiles.id) {
      handleFileOpen(data.payload.files[0]);
    } else if (data.id === "go_back") {
      const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
      setCurrentPath(parentPath);
    }
  };

  const createNewFolder = defineFileAction({
    id: "create_files",
    button: {
      name: "Crear carpeta",
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.folderCreate
    }
  });
  
  const editFiles = defineFileAction({
    id: "edit_files",
    button: {
      name: "Editar",
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.archive
    }
  });
  
  const renameFiles = defineFileAction({
    id: "rename_files",
    button: {
      name: "Renombrar",
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.code
    }
  });
  
  const myFileActions = [
    createNewFolder,
    editFiles,
    renameFiles,
    uploadFiles,
    ChonkyActions.DeleteFiles,
    goBack
  ];

  return (
    <div className="file-manager-root" style={{ height: "90vh" }}>
      {/* Input de archivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      
      <FileBrowser
        files={files}
        folderChain={folderChain}
        fileActions={myFileActions}
        onFileAction={handleAction}
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        clearSelectionOnOutsideClick={true}
      >
        <FileNavbar />
        <FileToolbar />
        <FileList />
        <FileContextMenu />
      </FileBrowser>
    </div>
  );
};

export default FileManager;