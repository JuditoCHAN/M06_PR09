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
  defineFileAction
} from "@aperturerobotics/chonky";

const ExampleFolderData = () => {
    return {
      files: [
        {
          id: "1",
          name: "Normal file.yml",
          isDir: false,
          size: 890,
          modDate: new Date("2012-01-01")
        },
        {
          id: "2",
          name: "Hidden file.mp4",
          isDir: false,
          isHidden: true,
          size: 50000
        },
        {
          id: "3",
          name: "Normal folder",
          isDir: true,
          childrenCount: 12
        },
        {
          id: "7zp",
          name: "Encrypted file.7z",
          isEncrypted: true
        },
        {
          id: "mEt",
          name: "Text File.txt",
          isDir: false
        }
      ],
      currentPath: [
        { id: "zxc", name: "Folder", isDir: true, childrenCount: 12 },
        { id: "asd", name: "Another Folder", isDir: true }
      ]
    };
  };



// set chonky default
setChonkyDefaults({ iconComponent: ChonkyIconFA });

// dummy data
const { files, currentPath } = ExampleFolderData();
console.log(files, currentPath);

const handleAction = (data) => {
  if (data.id === createNewFolder.id) alert("Create Folder Action");
  if (data.id === editFiles.id) alert("Edit Folder Action");
  if (data.id === renameFiles.id) alert("Rename Folder Action");
  if (data.id === ChonkyActions.UploadFiles.id) alert("Upload Folder Action");
  if (data.id === ChonkyActions.DownloadFiles.id)
    alert("Download Folder Action");
  if (data.id === ChonkyActions.DeleteFiles.id) alert("Delete Folder Action");
  if (data.id === ChonkyActions.OpenFiles.id)
    alert("Fetch another file structure");
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

const FileManager = () => {
  return (
    <div style={{ height: 700 }}>
            {/* <FullFileBrowser files={files} folderChain={folderChain} /> */}
      <FileBrowser
        files={files}
        folderChain={currentPath}
        fileActions={myFileActions}
        onFileAction={handleAction}
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        clearSelectionOnOutsideClick={true}
        disableDragAndDropProvider={true}
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
