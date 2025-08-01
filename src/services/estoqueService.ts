import { db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";

export interface ItemEstoque {
  nome: string;
  quantidade: number;
  valorUnitario?: number;
  descricao?: string;
  categoria: string;
  unidade: string;
  localizacao: string;
  estado: 'Ótimo' | 'Bom' | 'Razoável' | 'Ruim' | 'Péssimo';
  responsavel?: string;
  createdAt?: Date;
}

export const addItemEstoque = async (item: ItemEstoque) => {
  try {
    const docRef = await addDoc(collection(db, "estoque"), {
      ...item,
      createdAt: new Date(),
    });
    return { id: docRef.id, ...item };
  } catch (error) {
    console.error("Erro ao adicionar item ao estoque:", error);
    throw error;
  }
};