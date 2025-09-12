import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


export const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  circle1: {
    position: 'absolute',
    top: 100,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#2196F3',
    opacity: 0.8,
  },

  circle2: {
    position: 'absolute',
    top: 700,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#2196F3',
    opacity: 0.8,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  formContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    marginTop: screenHeight * 0.05,
    shadowColor: '#2196F3',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logoContainer: {
    marginBottom: 20,
  },

  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#28292bff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  logo: {
    width: 200,
    height: 100,
  },

  schoolName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f0f23',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },

  welcomeText: {
    fontSize: 14,
    color: '#0f0f23',
    textAlign: 'center',
    lineHeight: 20,
  },

  loginForm: {
    marginBottom: 32,
  },

  inputGroup: {
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f0f23',
    marginBottom: 8,
  },

  inputWrapper: {
    position: 'relative',
  },

  textInput: {
    height: 54,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  inputFocused: {
    borderColor: '#28292bff',
    backgroundColor: '#ffffff',
  },

  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },

  eyeIconText: {
    fontSize: 16,
  },

  loginButton: {
    height: 54,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#28292bff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  loginButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0,
    elevation: 0,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  biometricStatus: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },

  biometricStatusText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
  },

  forgotPasswordText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
});