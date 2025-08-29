import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../etudiant/pages/auth/login/page';
import ChangePassword from '../etudiant/pages/auth/change-password/page';
import Profile from '../etudiant/pages/profile/general';
import AllCoursesStudent from '../etudiant/pages/allCourses/page';
import ShowProfileInfos from '../etudiant/pages/profile/showProfileInfos';
import NotificationsStudent  from '../etudiant/pages/notifications/page';
import Scanner from '../etudiant/components/scanner';
import QRCodeScreen from '../etudiant/pages/qrcode/page';
import NotificationsInfos from '../etudiant/pages/NotificationsInfos/page';
import HomeStudent from '../etudiant/pages/home/page';
import MatieresStudent from '../etudiant/pages/matieres/page';
import Absences from '../etudiant/pages/absences/page';

export type RootStackParamList = {
  Login: { userLogin: string; userRole: string; firstLogin: number };
  ChangePassword: { userLogin: string; userRole: string; firstLogin: number };
  HomeStudent: { 
    userLogin: string; 
    userRole: string; 
    firstLogin: number;
    email: string;
    fiiereId?: string;
    niveauId?: string;
    classeId?: string;
    matieres?: any[];
  };
  NotReady: undefined;
  Profile: undefined;
  AllCoursesStudent: { userLogin: string };
  ShowProfileInfos: undefined;
  NotificationsStudent: undefined;
  NotificationsInfos: undefined;
  Scanner: {
    matiereId: string;
    courseLibelle?: string;
    courseInfo?: {
      start: string;
      end: string;
      enseignant: string;
      salle: string
    };
  };
  MatieresStudent: {
    matieres?: any[];
  }
  QRCodeScreen: { matiereId: string, courseLibelle: string};
  Absences: undefined;

};


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Scanner" component={Scanner} />
        <Stack.Screen name="QRCodeScreen" component={QRCodeScreen} />
        <Stack.Screen name="NotificationsInfos" component={NotificationsInfos} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="ShowProfileInfos" component={ShowProfileInfos}/>
        <Stack.Screen name="Absences" component={Absences} />


        <Stack.Screen name="HomeStudent" component={HomeStudent} />
        <Stack.Screen name="AllCoursesStudent" component={AllCoursesStudent} />
        <Stack.Screen name="MatieresStudent" component={MatieresStudent} />
        <Stack.Screen name="NotificationsStudent" component={NotificationsStudent} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
