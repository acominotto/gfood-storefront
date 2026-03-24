import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineSemanticTokens,
  defineSlotRecipe,
  defineTokens,
} from "@chakra-ui/react";
import { drawerAnatomy } from "@chakra-ui/react/anatomy";

const brandPalette = defineTokens.colors({
  brand: {
    25: { value: "#FEF9F9" },
    50: { value: "#FEF2F2" },
    100: { value: "#FDE4E5" },
    200: { value: "#FBCECF" },
    300: { value: "#F8B1B3" },
    400: { value: "#F58B8F" },
    500: { value: "#F15E63" },
    600: { value: "#EB2027" },
    700: { value: "#A8171C" },
    800: { value: "#821216" },
    900: { value: "#5C0D10" },
    950: { value: "#3B080A" },
  },
});

const headingFont = defineTokens.fonts({
  heading: {
    value: "var(--font-heading), sans-serif",
  },
});

const brandSemantic = defineSemanticTokens.colors({
  brand: {
    contrast: {
      value: { _light: "white", _dark: "white" },
    },
    fg: {
      value: {
        _light: "{colors.brand.700}",
        _dark: "{colors.brand.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.brand.100}",
        _dark: "{colors.brand.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.brand.200}",
        _dark: "{colors.brand.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.brand.300}",
        _dark: "{colors.brand.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.brand.600}",
        _dark: "{colors.brand.600}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.brand.500}",
        _dark: "{colors.brand.500}",
      },
    },
    border: {
      value: {
        _light: "{colors.brand.500}",
        _dark: "{colors.brand.400}",
      },
    },
  },
});

const drawerSlotTheme = defineSlotRecipe({
  slots: drawerAnatomy.keys(),
  base: {
    header: {
      bg: { _light: "brand.50" },
    },
  },
});

export const themeConfig = defineConfig({
  theme: {
    tokens: {
      colors: brandPalette,
      fonts: headingFont,
    },
    semanticTokens: {
      colors: brandSemantic,
    },
    slotRecipes: {
      drawer: drawerSlotTheme,
    },
  },

});

export const system = createSystem(defaultConfig, themeConfig);
