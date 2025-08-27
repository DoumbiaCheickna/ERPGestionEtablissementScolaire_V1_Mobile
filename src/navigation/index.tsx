import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../etudiant/pages/auth/login/page';
import ChangePassword from '../etudiant/pages/auth/change-password/page';
import Home from '../etudiant/pages/home/page';
import Profile from '../etudiant/pages/profile/general';
import AllCourses from '../etudiant/pages/allCourses/page';
import ShowProfileInfos from '../etudiant/pages/profile/showProfileInfos';
import Notifications  from '../etudiant/pages/notifications/page';
import Scanner from '../etudiant/components/scanner';
import QRCodeScreen from '../etudiant/pages/qrcode/page';
import NotificationsInfos from '../etudiant/pages/NotificationsInfos/page';

export type RootStackParamList = {
  Login: { userLogin: string; userRole: string; firstLogin: number };
  ChangePassword: { userLogin: string; userRole: string; firstLogin: number };
  Home: { 
    userLogin: string; 
    userRole: string; 
    firstLogin: number;
    email: string;
    classeId?: string;
    matieres?: any[];
  };
  NotReady: undefined;
  Profile: undefined;
  AllCourses: { userLogin: string };
  ShowProfileInfos: undefined;
  Notifications: undefined;
  NotificationsInfos: undefined;
  Scanner: {
    matiereId: string;
    onEmargementSuccess?: () => void;
    courseLibelle?: string;
    courseInfo?: {
      start: string;
      end: string;
      enseignant: string;
    };
  };
  QRCodeScreen: { matiereId: string, courseLibelle: string};
  Absences: undefined;

};


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login as any} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="ShowProfileInfos" component={ShowProfileInfos}/>
        <Stack.Screen name="AllCourses" component={AllCourses} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="NotificationsInfos" component={NotificationsInfos} />
        <Stack.Screen name="Scanner" component={Scanner} />
        <Stack.Screen name="QRCodeScreen" component={QRCodeScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
