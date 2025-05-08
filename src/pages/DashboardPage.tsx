import { FullFileBrowser } from "@aperturerobotics/chonky";
import { ChonkyIconFA } from "@aperturerobotics/chonky-icon-fontawesome";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../css/dashboard.css";

function StartPage() {
  return (
        <div className="dashboard">   
            <FullFileBrowser 
            files={[]}
            iconComponent={ChonkyIconFA}
            />
        </div>
  );
}

export default StartPage;