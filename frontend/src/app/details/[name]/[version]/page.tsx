// app/details/[name]/[version]/page.tsx
"use client";

import { useEffect,useState } from "react";
import * as S from "../../../../styles/detailPage.module";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useId } from "../../../context/IdContext";
import * as A from "../../../utils/api";
import {useRouter} from 'next/navigation';
import { useUpdateData } from "../../../context/UpdateContext";

type RateData = {
  [key: string]: string | number | null;
};


const DetailPage = ({ params }: { params: { name: string; version: string , id:string} }) => {
  const {id,setId} = useId();
  const [rateData, setRateData] = useState<RateData | null>(null);
  const [costData,setCostData] = useState<any>(null);
  const [dependency, setDependency] = useState(false);
  const { name, version } = params;
  const { setUpdateData } = useUpdateData();
  const router = useRouter();
  
  useEffect(() => {
    if (id) {
      const fetchRateData = async () => {
        const response = await A.getRatingByID(id);
        setRateData(response);
      };
      fetchRateData();
    }
  }, [id]);
  useEffect(() => {
    if (id) {
      const fetchCostData = async () => {
        const response = await A.getCostByID(id, dependency);
        setCostData(response);
      };
      fetchCostData();
    }
  }, [id, dependency]);

  console.log("id:",id);
  console.log("Current apiData state:", rateData);
  console.log("Current costData state:", costData);

  const handleUpdateClick = async () => {
    setUpdateData(name, version, id);
    router.push(`/update`);
  };

  const handleDependencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDependency(event.target.checked);
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
    const base64Content = packageData.data.Content;
    const binaryContent = atob(base64Content);

    const binaryArray = Uint8Array.from(binaryContent, char => char.charCodeAt(0));
    
    const blob = new Blob([binaryArray], { type: "application/zip" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${packageData.metadata.Name}-${packageData.metadata.Version}.zip`; 
    a.click();

    URL.revokeObjectURL(url); 
  } catch (error) {
    alert("Failed to download the package");
    console.error("Error downloading package:", error);
  }
};


  return (
    <ProtectedRoute>
    <S.Container>
      <title>detail page of package</title>
      <S.Header>
        {name} {version}
      </S.Header>
      {rateData ? (
        <div>
          <S.RateContainer>
        {rateData &&
          Object.entries(rateData).map(([key, value]) => {
            if (typeof value === "string" || typeof value === "number" || value === null) {
              return (
                <S.RateItem
                  key={key}
                >
                  <S.RateKey>{key.replace(/([A-Z])/g, " $1")}</S.RateKey>
                  <S.RateValue>{value ?? "N/A"}</S.RateValue>
                </S.RateItem>
        );
      }
      return null;
    })}
</S.RateContainer>
              <S.CheckboxContainer>
              <S.CheckboxLabel>
                <S.Checkbox
                  type="checkbox"
                  checked={dependency}
                  onChange={handleDependencyChange}
                />
                View With Dependency
              </S.CheckboxLabel>
              </S.CheckboxContainer>
          <S.table>
            <thead>
              <tr>
                <S.th>ID</S.th>
                <S.th>Standalone Cost</S.th>
                <S.th>Total Cost</S.th>
              </tr>
            </thead>
            <tbody>
              {costData &&
                Object.entries(costData).map(([costId, costs]: [string, any]) => (
                  <tr key={costId}>
                    <S.td>{costId}</S.td>
                    <S.td>{costs.standaloneCost || "N/A"}</S.td>
                    <S.td>{costs.totalCost || "N/A"}</S.td>
                  </tr>
                ))}
            </tbody>
          </S.table>
        </div>
      ) : (
        <p>Loading...</p>
      )}
      <S.buttonContainer>
      <S.updateButton onClick={handleUpdateClick}>Update</S.updateButton>
      <S.deleteButton onClick={handleDeleteClick} >
        Delete Package
      </S.deleteButton>
      <S.downloadButton onClick={handleDownloadClick} >
        Download Package
      </S.downloadButton>
      </S.buttonContainer>
    </S.Container>
  </ProtectedRoute>
);
};


export default DetailPage;
