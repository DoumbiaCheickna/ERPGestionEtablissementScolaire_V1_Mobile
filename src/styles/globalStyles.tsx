// styles/GlobalStyles.ts
import { StyleSheet } from 'react-native';

// Définition du thème
export const theme = {
  colors: {
    primary: '#000000',
    secondary: '#007AFF',
    background: '#f5f5f5ff',
    surface: '#f0f0f0',
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#dddddd',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 18,
    xxlarge: 24,
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 15,
    xlarge: 20,
  },
  shadow: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 5.84,
      elevation: 8,
    },
  },
};

// Styles globaux réutilisables
export const globalStyles = StyleSheet.create({
  // Conteneurs
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  formContainer: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  
  // Inputs
  inputContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.large,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.large,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.large,
    backgroundColor: theme.colors.background,
    ...theme.shadow.light,
  },
  
  // Boutons
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadow.medium,
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.fontSize.large,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.large,
    fontWeight: '600',
  },
  
  // Textes
  title: {
    fontSize: theme.fontSize.xxlarge,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.fontSize.xlarge,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  bodyText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
  },
  linkText: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  
  // Utilitaires
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mt_sm: { marginTop: theme.spacing.sm },
  mt_md: { marginTop: theme.spacing.md },
  mt_lg: { marginTop: theme.spacing.lg },
  mb_sm: { marginBottom: theme.spacing.sm },
  mb_md: { marginBottom: theme.spacing.md },
  mb_lg: { marginBottom: theme.spacing.lg },
});