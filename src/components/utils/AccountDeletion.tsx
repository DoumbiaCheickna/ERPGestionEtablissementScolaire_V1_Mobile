import { Alert } from "react-native";
import { clearAllData, getData } from "./secureStorage";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export const handleDeleteMyAccount = (navigation: any) => {
  Alert.alert(
    "Supprimer le compte",
    "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.",
    [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => DeleteMyAccount(navigation) }
    ]
  );
};

export const DeleteMyAccount = async (navigation: any) => {
  try {
    const userLogin = await getData("userLogin");
    if (!userLogin) {
      Alert.alert("Erreur", "Impossible de récupérer votre login.");
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("login", "==", userLogin));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      Alert.alert("Erreur", "Utilisateur introuvable.");
      return;
    }

    const userDoc = querySnapshot.docs[0];
    await deleteDoc(doc(db, "users", userDoc.id));

    await clearAllData();

    navigation.navigate("Login" as never);

    Alert.alert("Succès", "Votre compte a été supprimé avec succès.");
  } catch (error) {
    console.error("Erreur lors de la suppression du compte :", error);
    Alert.alert("Erreur", "Impossible de supprimer votre compte.");
  }
};
