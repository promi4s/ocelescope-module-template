import type { OcelescopeConfig } from "@ocelescope/core";
import example from "@instance/example-module";
import discovery from "@ocelescope/discovery";
import filter from "@ocelescope/filter";
import overview from "@ocelescope/log-overview";
import management from "@ocelescope/management";
import plugin from "@ocelescope/plugin";

export default {
  modules: [management, overview, plugin, discovery, filter, example],
  navbarGroups: [
    {
      modulesNames: [management.name, overview.name, filter.name, discovery.name],
    },
    { modulesNames: [plugin.name] },
    { title: "Custom", modulesNames: [example.name] },
  ],
} satisfies OcelescopeConfig;
