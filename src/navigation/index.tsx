import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../auth/login/page';
import ChangePassword from '../auth/change-password/page';
import AllCoursesStudent from '../etudiant/pages/allCourses/page';
import ShowProfileInfosStudent from '../etudiant/pages/profile/showProfileInfos';
import ShowProfileInfosProfesseur from '../professeur/pages/profile/showProfileInfos';
import Scanner from '../components/scanner';
import QRCodeScreen from '../etudiant/pages/qrcode/page';
import NotificationsInfos from '../NotificationsInfos/page';
import HomeStudent from '../etudiant/pages/home/page';
import MatieresStudent from '../etudiant/pages/matieres/page';
import Absences from '../etudiant/pages/absences/page';
import HomeProfesseur from '../professeur/pages/home/page';
import AllCoursesProfesseur from '../professeur/pages/allCourses/page';
import MatieresClassesProfesseur from '../professeur/pages/enseignments/page';
import Notifications from '../notifications/page';
import ProfileStudent from '../etudiant/pages/profile/general';
import ProfileProfesseur from '../professeur/pages/profile/general';
import Landing from '../landing/Landing';
import UserProfile from '../Social/UserProfile/page';
import Posts from '../Social/posts/page';
import Evaluations from '../professeur/pages/evaluations/page';
import AddNote from '../professeur/pages/evaluations/addNote/page';

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
  MatieresClassesProfesseur: undefined;
  HomeProfesseur: any;
  NotReady: undefined;
  ProfileProfesseur: undefined;
  ProfileStudent: undefined;
  AllCoursesStudent: { userLogin: string };
  AllCoursesProfesseur: undefined;
  ShowProfileInfosStudent: undefined;
  ShowProfileInfosProfesseur: undefined;
  Notifications: undefined;
  NotificationsInfos: undefined;
  Scanner: {
    matiereId: string;
    courseLibelle?: string;
    courseInfo?: {
      start: string;
      end: string;
      enseignant: string;
      class_ids: any;
      classes: any;
      salle: string
    };
  };
  Landing: undefined;
  MatieresStudent: {
    matieres?: any[];
  }
  QRCodeScreen: { matiereId: string, courseLibelle: string};
  Absences: undefined;
  Posts: undefined;
  UserProfile: { userId: string };
  Evaluations: undefined;
  AddNote: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={Landing} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Scanner" component={Scanner} />
        <Stack.Screen name="QRCodeScreen" component={QRCodeScreen} />
        <Stack.Screen name="NotificationsInfos" component={NotificationsInfos} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="Absences" component={Absences} />
        <Stack.Screen name="Notifications" component={Notifications} />

        {/* Evaluations */}
        <Stack.Screen name="Evaluations" component={Evaluations} />
        <Stack.Screen name="AddNote" component={AddNote} />


        {/* Posts Feature */}
        <Stack.Screen name="Posts" component={Posts} />
        <Stack.Screen name="UserProfile" component={UserProfile} />

        <Stack.Screen name="HomeStudent" component={HomeStudent} />
        <Stack.Screen name="AllCoursesStudent" component={AllCoursesStudent} />
        <Stack.Screen name="ProfileStudent" component={ProfileStudent} />
        <Stack.Screen name="MatieresStudent" component={MatieresStudent} />
        <Stack.Screen name="ShowProfileInfosStudent" component={ShowProfileInfosStudent}/>

        <Stack.Screen name="HomeProfesseur" component={HomeProfesseur} />
        <Stack.Screen name="AllCoursesProfesseur" component={AllCoursesProfesseur} />
        <Stack.Screen name="MatieresClassesProfesseur" component={MatieresClassesProfesseur} />
        <Stack.Screen name="ProfileProfesseur" component={ProfileProfesseur} />
        <Stack.Screen name="ShowProfileInfosProfesseur" component={ShowProfileInfosProfesseur}/>

      </Stack.Navigator>
    </NavigationContainer>
  );
}