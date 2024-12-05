// app/details/[name]/[version]/page.tsx
"use client";

import { useEffect,useState } from "react";
import * as S from "../../../../styles/detailPage.module";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useId } from "../../../context/IdContext";
import * as A from "../../../utils/api";
import {useRouter} from 'next/navigation';
import { useUpdateData } from "../../../context/UpdateContext";


const DetailPage = ({ params }: { params: { name: string; version: string , id:string} }) => {
  const {id,setId} = useId();
  const [rateData, setRateData] = useState<any>(null);
  const [costData,setCostData] = useState<any>(null);
  const [dependency, setDependency] = useState(false);
  const { name, version } = params;
  const { setUpdateData } = useUpdateData();
  const router = useRouter();
  
  useEffect(() => {
    if(!id) {
      setId(params.id);
    }
    if (id) {
      const fetchRateData = async () => {
        const response = await A.getRatingByID(id);
        setRateData(response);
      };
      const fetchCostData = async() => {
        const response = await A.getCostByID(id,dependency);
        setCostData(response);
      }
      fetchRateData();
      fetchCostData();
    }
  },[id,dependency,params.id,setId]);

  console.log("id:",id);
  console.log("Current apiData state:", rateData);
  console.log("Current costData state:", costData);

  const handleUpdateClick = async () => {
    setUpdateData(name, version, id);
    router.push(`/update`);
  };

  const handleDeleteClick = async () => {
    const confirmDelete = confirm("Are you sure you want to delete this package?");
    if (confirmDelete) {
      try{
        await A.deletePackageByID(id);
        alert("Package deleted successfully");
        router.push("/search");
      }catch(error){
        alert("Failed to delete package");
      }
  }
};
const handleDownloadClick = async () => {
  try {
    const packageData = await A.getPackageByID(id); 
    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${version}.json`; 
    a.click();

    URL.revokeObjectURL(url); 
  } catch (error) {
    alert("Failed to download the package");
    console.error("Error downloading package:", error);
  }
};


  return (
    <ProtectedRoute>
    <div>
      <S.Header>{name} {version} </S.Header>
      {rateData ? ( 
          <div>
            <p><strong>Bus Factor:</strong> {rateData.BusFactor }</p>
            <p><strong>Bus Factor Latency:</strong> {rateData.BusFactorLatency}</p>
            <p><strong>Correctness:</strong> {rateData.Correctness}</p>
            <p><strong>Correctness Latency:</strong> {rateData.CorrectnessLatency}</p>
            <p><strong>Ramp Up:</strong> {rateData.RampUp}</p>
            <p><strong>Ramp Up Latency:</strong> {rateData.RampUpLatency}</p>
            <p><strong>Responsive Maintainer:</strong> {rateData.ResponsiveMaintainer}</p>
            <p><strong>Responsive Maintainer Latency:</strong> {rateData.ResponsiveMaintainerLatency}</p>
            <p><strong>License Score:</strong> {rateData.LicenseScore}</p>
            <p><strong>License Score Latency:</strong> {rateData.LicenseScoreLatency}</p>
            <p><strong>Good Pinning Practice:</strong> {rateData.GoodPinningPractice}</p>
            <p><strong>Good Pinning Practice Latency:</strong> {rateData.GoodPinningPracticeLatency}</p>
            <p><strong>Pull Request:</strong> {rateData.PullRequest}</p>
            <p><strong>Pull Request Latency:</strong>{rateData.PullRequestLatency}</p>
            <p><strong>Net Score:</strong> {rateData.NetScore}</p>
            <p><strong>Net Score Latency:</strong> {rateData.NetScoreLatency}</p>
            <button onClick={() => setDependency(!dependency)}>
          {dependency ? "View Without Dependency" : "View With Dependency"}
        </button>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Standalone Cost</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {costData &&
                  Object.entries(costData).map(([costId, costs]: [string, any]) => (
                    <tr key={costId}>
                      <td>{costId}</td>
                      <td>{costs.standaloneCost || "N/A"}</td>
                      <td>{costs.totalCost || "N/A"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            
          </div>
          
        ) : (
          <p>Loading...</p> 
        )}
        <button onClick = {handleUpdateClick}>Update</button>
        <button onClick={handleDeleteClick} style={{ color: "red" }}>
        Delete Package
      </button>
      <button onClick={handleDownloadClick} style={{ color: "blue" }}>
          Download Package
        </button>
      </div>
   
    </ProtectedRoute>
  );
};

export default DetailPage;
