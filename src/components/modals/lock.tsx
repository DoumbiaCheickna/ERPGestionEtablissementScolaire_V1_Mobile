import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
