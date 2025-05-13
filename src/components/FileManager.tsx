import { useState, useEffect } from "react";
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

setChonkyDefaults({ iconComponent: ChonkyIconFA });

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [folderChain, setFolderChain] = useState([{ 
    id: "/", 
    name: "home", 
    isDir: true 
  }]);

  const [currentPath, setCurrentPath] = useState("/");
  const [trigger, setTrigger] = useState(0);

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
  }, [currentPath,trigger]);

  // Manejar cambio de directorio
  const handleFileOpen = (file) => {
    if (file.isDir) {
      setCurrentPath(file.id);
    }
  };
  const handleDelete = (subId:number)=>{
    const response = fetch("http://localhost:5001/dashboard?subId="+subId, {
      method: "delete",

    }).then();

    reload();
  }
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
const handleEditFolder = async (folderPath) => {
  const metadata = prompt("Enter new metadata:");

  if (!metadata) return;

  try {
    const response = await fetch("http://localhost:5001/dashboard/edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: folderPath,
        metadata,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      alert(`Folder edited with new metadata`);
      reload();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error editing folder:", error);
    alert("Error editing folder");
  }
};
const handleUploadFile = async (folderPath) => {
  const formData = new FormData();
  const file = document.getElementById("fileInput").files[0]; // Assuming you have an <input id="fileInput" />

  if (!file) return;

  formData.append("file", file);
  formData.append("path", folderPath);

  try {
    const response = await fetch("http://localhost:5001/dashboard/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      alert(`File uploaded: ${file.name}`);
      reload();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    alert("Error uploading file");
  }
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

const handleAction = (data) => {
  if (data.id === createNewFolder.id) {
    handleCreateDirectory();
  }

  // Handle Edit Folder action
  if (data.id === editFiles.id) {
    const selectedFile = data.state.selectedFiles[0];
    if (selectedFile) {
      handleEditFolder(selectedFile.id);  
    }
  }

  // Handle Rename Folder action
  if (data.id === renameFiles.id) {
    const selectedFile = data.state.selectedFiles[0]; 
    if (selectedFile) {
      handleRenameFolder(selectedFile.id); 
    }
  }

  // Handle Upload Files action
  if (data.id === ChonkyActions.UploadFiles.id) {
    const selectedFile = data.state.selectedFiles[0]; 
    if (selectedFile && selectedFile.isDir) {
      handleUploadFile(selectedFile.id); 
    }
  }

  // Handle Download Files action
  if (data.id === ChonkyActions.DownloadFiles.id) {
    alert("Download Folder Action");
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
    // Navigate to the parent directory
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    setCurrentPath(parentPath);
  }

};

  
  const createNewFolder = defineFileAction({
    id: "create_files",
    button: {
      name: "Create Folder",
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.folderCreate
    }
  });
  
  const editFiles = defineFileAction({
    id: "edit_files",
    button: {
      name: "Edit",
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.archive
    }
  });
  
  const renameFiles = defineFileAction({
    id: "rename_files",
    button: {
      name: "Rename",
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.code
    }
  });
  
  const myFileActions = [
    createNewFolder,
    editFiles,
    renameFiles,
    ChonkyActions.UploadFiles,
    ChonkyActions.DownloadFiles,
    ChonkyActions.DeleteFiles
  ];
  return (
    <div style={{ height: "90vh" }}>
      <FileBrowser
        files={files}
        folderChain={folderChain}
        fileActions={myFileActions}
        onFileAction={handleAction}
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        clearSelectionOnOutsideClick={true}
        // disableDragAndDropProvider={true}
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