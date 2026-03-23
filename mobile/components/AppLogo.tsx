import { Image, StyleSheet, View } from "react-native";

interface AppLogoProps {
  size?: number;
}

export const AppLogo = ({ size = 88 }: AppLogoProps) => {
  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Image source={require("../assets/logo.png")} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "center"
  },
  image: {
    width: "100%",
    height: "100%"
  }
});
