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
  const {id} = useId();
  const [apiData, setApiData] = useState<any>(null);
  const { name, version } = params;
  const { setUpdateData } = useUpdateData();
  const router = useRouter();
  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        const response = await A.getRatingByID(id);
        setApiData(response);
      };
      fetchData();
    }
  },[id]);

  console.log("id:",id);
  console.log("Current apiData state:", apiData);

  const handleUpdateClick = async () => {
    setUpdateData(name, version, id);
    router.push(`/update`);
  };

  return (
    <ProtectedRoute>
    <div>
      <S.Header>{name} {version} </S.Header>
      {apiData ? ( // Render only when apiData is set
          <div>
            <p><strong>Bus Factor:</strong> {apiData.BusFactor }</p>
            <p><strong>Correctness:</strong> {apiData.Correctness}</p>
            <p><strong>Ramp Up:</strong> {apiData.RampUp}</p>
            <p><strong>Responsive Maintainer:</strong> {apiData.ResponsiveMaintainer}</p>
            <p><strong>License Score:</strong> {apiData.LicenseScore}</p>
            <p><strong>Good Pinning Practice:</strong> {apiData.GoodPinningPractice}</p>
            <p><strong>Pull Request:</strong> {apiData.PullRequest}</p>
            <p><strong>Net Score:</strong> {apiData.NetScore}</p>
          </div>
        ) : (
          <p>Loading...</p> 
        )}
        <button onClick = {handleUpdateClick}>Update</button>
      </div>
   
    </ProtectedRoute>
  );
};

export default DetailPage;
